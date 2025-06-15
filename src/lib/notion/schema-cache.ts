import { Client, DatabaseObjectResponse, GetDatabaseResponse } from '@notionhq/client';
import fs from 'fs/promises';
import path from 'path';

interface NotionProperty {
  id: string;
  type: string;
  name: string;
  // Add more specific property types as needed
  select?: {
    options: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
  multi_select?: {
    options: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
  status?: {
    options: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
  // Add other property configurations as needed
}

interface DatabaseSchema {
  id: string;
  title: string;
  properties: Record<string, NotionProperty>;
  lastUpdated: string;
}

export async function fetchAndCacheDatabaseSchemas(notion: Client, databaseIds: Record<string, string>) {
  const schemas: Record<string, GetDatabaseResponse> = {};
  const cacheDir = path.join(process.cwd(), '.notion-cache');
  
  try {
    // Create cache directory if it doesn't exist
    await fs.mkdir(cacheDir, { recursive: true });
    
    for (const [dbName, dbId] of Object.entries(databaseIds)) {
      try {
        // Fetch database schema from Notion
        const response = await notion.databases.retrieve({ database_id: dbId });
        
        // Store the full response
        schemas[dbName] = response;
        
        // Cache the schema to a file
        await fs.writeFile(
          path.join(cacheDir, `${dbName}.json`),
          JSON.stringify(response, null, 2)
        );
        
        console.log(`✅ Cached schema for database: ${dbName}`);
      } catch (error) {
        console.error(`❌ Failed to fetch schema for database ${dbName}:`, error);
      }
    }
    
    // Cache the complete schemas object
    await fs.writeFile(
      path.join(cacheDir, 'schemas.json'),
      JSON.stringify(schemas, null, 2)
    );
    
    return schemas;
  } catch (error) {
    console.error('Failed to cache database schemas:', error);
    throw error;
  }
}

export async function loadCachedSchemas(): Promise<Record<string, GetDatabaseResponse> | null> {
  const cacheDir = path.join(process.cwd(), '.notion-cache');
  const schemasPath = path.join(cacheDir, 'schemas.json');
  
  try {
    const data = await fs.readFile(schemasPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No cached schemas found');
    return null;
  }
}

export async function getDatabaseSchema(dbName: string): Promise<GetDatabaseResponse | null> {
  const schemas = await loadCachedSchemas();
  return schemas?.[dbName] || null;
} 