import { Client } from '@notionhq/client';
import { getDatabaseSchema } from './schema-cache';
import { buildQuery, DatabaseName, FilterOperator, DateFilterOperator } from './query-templates';
import type { 
  PageObjectResponse, 
  PropertyItemObjectResponse,
  RichTextItemResponse
} from '@notionhq/client/build/src/api-endpoints';

type NotionFilter = {
  property: string;
  filterType: string;
  operator: FilterOperator | DateFilterOperator;
  value: any;
};

export class NotionQueryService {
  constructor(private notion: Client) {}

  async executeQuery(
    databaseName: DatabaseName,
    question: string,
    queryParams?: {
      filters: NotionFilter[];
      sort?: {
        property: string;
        direction: 'ascending' | 'descending';
      };
    }
  ) {
    // Get the database schema
    const schema = await getDatabaseSchema(databaseName);
    if (!schema) {
      throw new Error(`Database schema not found for: ${databaseName}`);
    }

    // Build the query using the provided parameters
    const query = buildQuery(databaseName, queryParams?.filters || [], queryParams?.sort);

    // Execute the query
    const response = await this.notion.databases.query({
      database_id: schema.id,
      filter: query.query.filter as any, // Type assertion needed due to Notion API type limitations
      sorts: query.query.sorts
    });

    // Format the response
    const formattedResponse = response.results.map(page => {
      if (!('properties' in page)) return '• Untitled';
      
      const titleProperty = Object.entries(schema.properties)
        .find(([_, prop]) => (prop as { type: string }).type === 'title')?.[0];
      
      let title = 'Untitled';
      if (titleProperty && page.properties[titleProperty]) {
        const titleProp = page.properties[titleProperty];
        if ('title' in titleProp && Array.isArray(titleProp.title) && titleProp.title.length > 0) {
          const firstTitle = titleProp.title[0] as RichTextItemResponse;
          if (firstTitle.plain_text) {
            title = firstTitle.plain_text;
          }
        }
      }

      // Add status if it exists
      let statusText = '';
      if (page.properties['Status'] && 'select' in page.properties['Status']) {
        const statusProp = page.properties['Status'].select;
        if (statusProp && 'name' in statusProp) {
          statusText = ` (${statusProp.name})`;
        }
      }

      return `• ${title}${statusText}`;
    }).join('\n');

    return {
      formattedResponse,
      rawResults: response.results
    };
  }
} 