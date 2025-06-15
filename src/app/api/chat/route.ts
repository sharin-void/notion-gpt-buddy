import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai/client'
import { notion } from '@/lib/notion/client'
import { getNotionResources } from '@/lib/notion/resources'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    const resources = getNotionResources()

    // Create a system message that includes information about available Notion resources
    const systemMessage = `You are a helpful assistant that can interact with Notion. You have access to the following Notion resources:

Pages:
${Object.entries(resources.pages).map(([key, page]) => 
  `- ${page.name} (${page.description})`
).join('\n')}

Databases:
${Object.entries(resources.databases).map(([key, db]) => 
  `- ${db.name} (${db.description})
   Properties: ${Object.entries(db.properties).map(([name, type]) => `${name} (${type})`).join(', ')}`
).join('\n')}

When the user asks about a specific page or database, use the exact names provided above to reference them.`

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "gpt-4-turbo-preview",
    })

    return NextResponse.json({
      message: completion.choices[0].message.content
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 