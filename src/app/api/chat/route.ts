import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai/client'
import { notion } from '@/lib/notion/client'
import { getNotionResources } from '@/lib/notion/resources'
import { buildQuery, DatabaseName } from '@/lib/notion/query-templates'
import notionConfig from '../../../../notion-config.json'
import type { ChatCompletionMessage } from 'openai/resources/chat/completions'

// Helper function to execute Notion query
async function executeNotionQuery(query: any) {
  try {
    const response = await fetch('http://localhost:3000/api/notion/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    
    if (!response.ok) {
      throw new Error(`Query failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error executing Notion query:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Create system message with available queries
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful assistant that can query Notion databases. You have access to the following databases:

${Object.entries(notionConfig.databases).map(([name, id]) => `- ${name} (${id})`).join('\n')}

Available query types:
- testDatabase: Test query for the work database
- completedTasks: Get completed tasks from the tracker database
- recentProjects: Get recent projects from the projects database
- calendarEvents: Get calendar events with date filters
- workItems: Get work items with status filters

Current date and time: ${new Date().toLocaleString('en-US', { 
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  timeZoneName: 'short'
})}

When handling date-based queries:
1. For "next week" queries, use the current date to calculate the correct week range
2. For specific dates without a year, use the current year if the date is in the future
3. For dates in the past without a year, use next year
4. Always include the full week (Monday to Sunday) when querying by week
5. IMPORTANT: Always filter dates at the database level using the date filter operators

You MUST respond with a JSON object in this exact format:
{
  "database": "name_of_database",
  "filters": [
    {
      "property": "property_name",
      "filterType": "select|text|number|date|etc",
      "operator": "equals|contains|etc",
      "value": "filter_value"
    }
  ],
  "sort": {
    "property": "property_name",
    "direction": "ascending|descending"
  },
  "explanation": "Brief explanation of what you're going to do"
}

Examples:

1. For calendar events next week:
{
  "database": "calendar",
  "filters": [
    {
      "property": "Date",
      "filterType": "date",
      "operator": "next_week",
      "value": null
    }
  ],
  "sort": {
    "property": "Date",
    "direction": "ascending"
  },
  "explanation": "I'll fetch your calendar events for next week, sorted by date"
}

2. For graphic design projects:
{
  "database": "work",
  "filters": [
    {
      "property": "Category",
      "filterType": "select",
      "operator": "equals",
      "value": "Graphic Design"
    }
  ],
  "sort": {
    "property": "Name",
    "direction": "ascending"
  },
  "explanation": "I'll fetch your graphic design projects from the work database, sorted alphabetically by name"
}

3. For completed tasks:
{
  "database": "tracker",
  "filters": [
    {
      "property": "Status",
      "filterType": "select",
      "operator": "equals",
      "value": "Done"
    }
  ],
  "sort": {
    "property": "Last edited time",
    "direction": "descending"
  },
  "explanation": "I'll fetch your completed tasks, sorted by most recently edited"
}

4. For projects after 2019:
{
  "database": "projects",
  "filters": [
    {
      "property": "Created time",
      "filterType": "date",
      "operator": "after",
      "value": "2019-12-31"
    }
  ],
  "sort": {
    "property": "Created time",
    "direction": "descending"
  },
  "explanation": "I'll fetch your projects from 2020 onwards, sorted by creation date"
}`
    }

    const completion = await openai.chat.completions.create({
      messages: [
        systemMessage,
        {
          role: "user",
          content: messages[messages.length - 1].content
        }
      ],
      model: "gpt-4-turbo-preview",
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    })

    // Extract JSON from the response, handling potential markdown formatting
    const content = completion.choices[0].message.content || '{}'
    let response
    try {
      // First try direct JSON parse
      response = JSON.parse(content)
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        try {
          response = JSON.parse(jsonMatch[1])
        } catch (e2) {
          console.error('Failed to parse JSON from markdown:', e2)
          throw new Error('Invalid response format from AI')
        }
      } else {
        console.error('No valid JSON found in response:', content)
        throw new Error('Invalid response format from AI')
      }
    }

    if (response.database && Object.keys(notionConfig.databases).includes(response.database)) {
      // Build and execute the Notion query
      const query = buildQuery(
        response.database as DatabaseName,
        response.filters || [],
        response.sort
      )
      
      const queryResult = await executeNotionQuery(query)
      
      // Create a follow-up message to format the results
      const formatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that formats Notion query results into user-friendly responses. 
            Format the data in a clear, concise way. If there are no results, explain that to the user.
            If there's an error, explain what went wrong in a friendly way.`
          },
          {
            role: "user",
            content: `Please format these Notion query results for the user. The original question was: "${messages[messages.length - 1].content}"
            The query explanation was: "${response.explanation}"
            Here are the results: ${JSON.stringify(queryResult)}`
          }
        ],
        model: "gpt-4-turbo-preview"
      })

      return NextResponse.json({
        message: formatCompletion.choices[0].message.content
      })
    }

    return NextResponse.json({
      message: "I'm not sure how to help with that. Could you try asking about your projects, tasks, or other Notion content?"
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 