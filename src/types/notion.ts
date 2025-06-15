// In src/types/notion.ts
import { QueryDatabaseParameters } from '@notionhq/client/build/src/api-endpoints';

// Keep existing types
export type NotionPropertyType = 'title' | 'rich_text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'email' | 'phone_number' | 'formula' | 'relation' | 'rollup' | 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by'

export interface NotionPage {
  id: string
  name: string
  description: string
}

export interface NotionDatabase {
  id: string
  name: string
  description: string
  properties: Record<string, NotionPropertyType>
}

export interface NotionResources {
  pages: Record<string, NotionPage>
  databases: Record<string, NotionDatabase>
}

// Use Notion's own types for queries
export type DatabaseQuery = Omit<QueryDatabaseParameters, 'database_id'>;

export type ReadRequest = {
  type: 'page' | 'database';
  id: string;
  query?: DatabaseQuery;
};