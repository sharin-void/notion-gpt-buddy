import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ConversationService } from '@/lib/supabase/conversation-service'
import notionConfig from '../../../../notion-config.json'
import { getDatabaseSchema } from '@/lib/notion/schema-cache'
import { generateSystemPrompt } from '@/lib/notion/prompt-template'
import { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'
import { Client } from '@notionhq/client'
import { buildQuery } from '@/lib/notion/query-templates'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const openaiApiKey = process.env.OPENAI_API_KEY

if (!openaiApiKey) {
  throw new Error('Missing environment variable: OPENAI_API_KEY')
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
})

const conversationService = new ConversationService()

async function queryNotionDatabase(databaseId: string, query: any) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      ...query
    })
    return response.results
  } catch (error) {
    console.error('Error querying Notion database:', error)
    throw error
  }
}

async function searchNotionPages(query: string) {
  try {
    const response = await notion.search({
      query,
      filter: {
        property: 'object',
        value: 'page'
      }
    })
    return response.results
  } catch (error) {
    console.error('Error searching Notion pages:', error)
    throw error
  }
}

type DatabaseName = keyof typeof notionConfig.databases

export async function POST(req: Request) {
  try {
    const { messages, conversationId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      )
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await conversationService.getConversation(conversationId)
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }
    } else {
      // Create new conversation with first message as title
      const firstMessage = messages[0]?.content || 'New Conversation'
      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 47) + '...'
        : firstMessage
      conversation = await conversationService.createConversation(title)
    }

    // Save user message
    const userMessage = messages[messages.length - 1]
    if (userMessage.role === 'user') {
      await conversationService.addMessage(
        conversation.id,
        'user',
        userMessage.content
      )
    }

    // Get database schemas
    const schemas = await Promise.all(
      Object.entries(notionConfig.databases).map(async ([name, db]) => {
        const schema = await getDatabaseSchema(db.id)
        return schema ? { name, schema } : null
      })
    )

    const validSchemas = Object.fromEntries(
      schemas
        .filter((s): s is { name: string; schema: GetDatabaseResponse } => s !== null)
        .map(({ name, schema }) => [name, schema])
    )

    // Generate system prompt with database info
    const systemPrompt = generateSystemPrompt(validSchemas)
    
    // First, let ChatGPT analyze the user's request and determine if we need to query the database or search pages
    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `You are a query analyzer. Analyze the user's request and determine if it requires querying a database.

CRITICAL: You must respond with ONLY one of these two options:
1. A valid JSON object with query parameters (if a database query is needed)
2. The exact text "NO_QUERY_NEEDED" (if no database query is needed)

Do not provide any explanations, apologies, or other text. Only return the JSON or "NO_QUERY_NEEDED".

Examples:
- "How many days have I meditated?" -> Query tracker database
- "What's on my calendar next week?" -> Query calendar database  
- "Show me my video edits" -> Query work database
- "Hello" -> NO_QUERY_NEEDED` },
        ...messages
      ],
    })

    const analysisResponse = analysisCompletion.choices[0]?.message?.content?.trim()

    let results = null
    if (analysisResponse && analysisResponse !== 'NO_QUERY_NEEDED') {
      try {
        let queryParams;
        
        // Try to extract JSON from markdown code blocks or explanatory text
        if (analysisResponse.includes('```json')) {
          // Extract JSON from markdown code block
          const jsonMatch = analysisResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            queryParams = JSON.parse(jsonMatch[1].trim());
          } else {
            throw new Error('Could not extract JSON from code block');
          }
        } else if (analysisResponse.startsWith('{')) {
          // Direct JSON response
          queryParams = JSON.parse(analysisResponse);
        } else {
          // Try to find JSON anywhere in the response
          const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            queryParams = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        }
        
        if ('database' in queryParams) {
          // Handle database query
          const requestedDbName = queryParams.database.toLowerCase()
          const matchingDb = Object.entries(notionConfig.databases).find(
            ([name]) => name.toLowerCase() === requestedDbName
          )

          if (matchingDb) {
            const [databaseName, db] = matchingDb
            const query = buildQuery(databaseName as DatabaseName, queryParams.filters, queryParams.sort)
            results = await queryNotionDatabase(db.id, query)
          }
        } else if ('search' in queryParams) {
          // Handle page search
          results = await searchNotionPages(queryParams.search.query)
        }
      } catch (error) {
        console.error('Error parsing or executing query:', error)
        console.error('Analysis response was:', analysisResponse)
      }
    }

    // Now let ChatGPT respond to the user with the results
    const messagesWithContext = [
      { role: 'system', content: systemPrompt },
      ...messages,
      ...(results ? [{
        role: 'system',
        content: `Here are the results for your query:\n${JSON.stringify(results, null, 2)}\n\nPlease provide a natural, conversational response based on this data. Remember to be concise and only show titles unless more detail is requested. Do not explain the query process or show the query format.`
      }] : [])
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messagesWithContext,
    })

    const responseMessage = completion.choices[0]?.message

    if (!responseMessage || !responseMessage.content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    // Save assistant message
    await conversationService.addMessage(
      conversation.id,
      'assistant',
      responseMessage.content
    )

    return NextResponse.json({
      message: responseMessage,
      conversationId: conversation.id
    })
  } catch (error) {
    console.error('Error in chat route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
