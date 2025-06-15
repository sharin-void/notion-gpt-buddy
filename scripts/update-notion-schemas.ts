import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { fetchAndCacheDatabaseSchemas } from '../src/lib/notion/schema-cache.js';

// Load environment variables
config();

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read and parse the config file
const notionConfig = JSON.parse(
  readFileSync(join(__dirname, '../notion-config.json'), 'utf-8')
);

async function main() {
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ NOTION_API_KEY is not set in environment variables');
    process.exit(1);
  }

  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });

  console.log('🔄 Fetching and caching Notion database schemas...');
  
  try {
    // Extract just the database IDs
    const databaseIds = Object.entries(notionConfig.databases).reduce((acc, [key, value]) => {
      if (typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string') {
        acc[key] = value.id;
      }
      return acc;
    }, {} as Record<string, string>);

    await fetchAndCacheDatabaseSchemas(notion, databaseIds);
    console.log('✅ Successfully updated database schemas!');
  } catch (error) {
    console.error('❌ Failed to update database schemas:', error);
    process.exit(1);
  }
}

main(); 