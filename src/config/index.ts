import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY || '',
    activityLogDb: process.env.NOTION_ACTIVITY_LOG || '',
    filingsDb: process.env.NOTION_FILINGS_DB || '',
  },
  make: {
    baseUrl: process.env.MAKE_BASE_URL || 'https://api.make.com/v2',
    apiToken: process.env.MAKE_API_TOKEN || '',
    webhookSecret: process.env.MAKE_WEBHOOK_SECRET || '',
  },
};

export default config;
