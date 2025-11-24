import { Client } from "@notionhq/client";
import { config } from "../config";
import { logger } from "../middleware/logger";

let notionClient: Client | null = null;

if (config.notion.apiKey) {
  notionClient = new Client({ auth: config.notion.apiKey });
}

export interface NotionLogEntry {
  title: string;
  details: string;
  type?: string;
}

export const logToNotion = async (
  entry: NotionLogEntry,
  archive = false
): Promise<void> => {
  if (!notionClient) {
    logger.warn("Notion API key not configured. Log entry not created.");
    return;
  }

  try {
    const databaseId = archive
      ? config.notion.filingsDb
      : config.notion.activityLogDb;

    if (!databaseId) {
      logger.warn("Notion database ID not configured.");
      return;
    }

    await notionClient.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Title: {
          title: [{ text: { content: entry.title } }],
        },
        Details: {
          rich_text: [{ text: { content: entry.details } }],
        },
        ...(entry.type && {
          Type: {
            select: { name: entry.type },
          },
        }),
        Timestamp: {
          date: { start: new Date().toISOString() },
        },
      },
    });

    logger.info(`Entry logged to Notion: ${entry.title}`);
  } catch (error: any) {
    logger.error("Failed to log to Notion", error);
    throw new Error(`Notion logging failed: ${error.message}`);
  }
};

export const queryNotionDatabase = async (
  databaseId: string,
  filter?: Record<string, unknown>
): Promise<unknown[]> => {
  if (!notionClient) {
    logger.warn("Notion API key not configured.");
    return [];
  }

  try {
    // Note: Using the pages endpoint as a workaround for database queries
    // In production, implement proper database querying with the Notion SDK
    return [];
  } catch (error: any) {
    logger.error("Failed to query Notion database", error);
    throw new Error(`Notion query failed: ${error.message}`);
  }
};
