import notion, { NOTION_ACTIVITY_LOG, NOTION_FILINGS_DB } from '../config/notion';
import { NotionLogEntry } from '../types';

export class NotionService {
  async logActivity(entry: NotionLogEntry) {
    if (!NOTION_ACTIVITY_LOG) {
      throw new Error('NOTION_ACTIVITY_LOG is not configured');
    }

    try {
      const response = await notion.pages.create({
        parent: { database_id: NOTION_ACTIVITY_LOG },
        properties: {
          Title: {
            title: [
              {
                text: {
                  content: entry.title,
                },
              },
            ],
          },
          Status: {
            select: {
              name: entry.status,
            },
          },
          Type: {
            select: {
              name: entry.type,
            },
          },
          Description: {
            rich_text: [
              {
                text: {
                  content: entry.description || '',
                },
              },
            ],
          },
        },
      });

      return response;
    } catch (error) {
      console.error('Failed to log activity to Notion:', error);
      throw error;
    }
  }

  async createFiling(filing: {
    title: string;
    type: string;
    status: string;
    content: any;
  }) {
    if (!NOTION_FILINGS_DB) {
      throw new Error('NOTION_FILINGS_DB is not configured');
    }

    try {
      const response = await notion.pages.create({
        parent: { database_id: NOTION_FILINGS_DB },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: filing.title,
                },
              },
            ],
          },
          Type: {
            select: {
              name: filing.type,
            },
          },
          Status: {
            select: {
              name: filing.status,
            },
          },
        },
      });

      return response;
    } catch (error) {
      console.error('Failed to create filing in Notion:', error);
      throw error;
    }
  }

  async getDatabase(databaseId: string) {
    try {
      // Use the correct method from Notion client
      const response = await (notion.databases as any).query({
        database_id: databaseId,
      });

      return response.results;
    } catch (error) {
      console.error('Failed to query Notion database:', error);
      throw error;
    }
  }

  async updatePage(pageId: string, properties: any) {
    try {
      const response = await notion.pages.update({
        page_id: pageId,
        properties,
      });

      return response;
    } catch (error) {
      console.error('Failed to update Notion page:', error);
      throw error;
    }
  }
}

export default new NotionService();
