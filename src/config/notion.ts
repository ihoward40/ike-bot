import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notionApiKey = process.env.NOTION_API_KEY;

if (!notionApiKey) {
  throw new Error('NOTION_API_KEY environment variable is not set');
}

export const notion = new Client({
  auth: notionApiKey,
});

export const NOTION_ACTIVITY_LOG = process.env.NOTION_ACTIVITY_LOG || '';
export const NOTION_FILINGS_DB = process.env.NOTION_FILINGS_DB || '';

export default notion;
