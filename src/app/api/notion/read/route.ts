import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import notionConfig from "../../../../../notion-config.json";
import { ReadRequest } from "@/types/notion";

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_API_KEY,
    timeoutMs: 10000, // 10 second timeout
});

export async function POST(request: Request) {
    try {
        console.log('Received request');
        console.log('Request headers:', Object.fromEntries(request.headers.entries()));
        console.log('Request method:', request.method);
        
        // Log the raw request body
        const rawBody = await request.text();
        console.log('Raw request body:', rawBody);
        
        // Only try to parse if we have content
        if (!rawBody) {
            return NextResponse.json(
                { error: "Empty request body" },
                { status: 400 }
            );
        }

        const body: ReadRequest = JSON.parse(rawBody);
        console.log('Parsed request body:', body);
        const { type, id, query } = body;

        if (!id) {
            console.log('No ID provided');
            return NextResponse.json(
                { error: "ID is required" },
                { status: 400 }
            )
        }

        // Handling the request based on type
        switch (type) {
            case 'page':
                console.log('Fetching page:', id);
                try {
                    const page = await notion.pages.retrieve({ page_id: id });
                    console.log('Page data received');
                    return NextResponse.json({ data: page });
                } catch (error) {
                    console.error('Page fetch error:', error);
                    return NextResponse.json(
                        { error: 'Failed to fetch page', details: (error as Error).message },
                        { status: 500 }
                    );
                }

            case 'database':
                console.log('Fetching database:', id);
                try {
                    console.log('Query parameters:', query);
                    const [database, response] = await Promise.all([
                        notion.databases.retrieve({ database_id: id }),
                        notion.databases.query({
                            database_id: id,
                            ...(query || {})
                        })
                    ]);
                    console.log('Database data received');
                    console.log('Query results:', {
                        total: response.results.length,
                        firstItem: response.results[0],
                        lastItem: response.results[response.results.length - 1]
                    });
                    return NextResponse.json({
                        database: database,
                        items: response.results,
                        has_more: response.has_more,
                        next_cursor: response.next_cursor
                    });
                } catch (error) {
                    console.error('Database fetch error:', error);
                    if (error instanceof Error) {
                        console.error('Error details:', error.message);
                        console.error('Error stack:', error.stack);
                        // Add more detailed error information
                        if ('code' in error) {
                            console.error('Error code:', (error as any).code);
                        }
                        if ('body' in error) {
                            console.error('Error body:', (error as any).body);
                        }
                    }
                    return NextResponse.json(
                        { error: 'Failed to fetch database', details: (error as Error).message },
                        { status: 500 }
                    );
                }
                
            default:
                return NextResponse.json(
                    { error: "Invalid type" },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Request processing error:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json(
            { error: 'Failed to process request', details: (error as Error).message },
            { status: 500 }
        );
    }
}