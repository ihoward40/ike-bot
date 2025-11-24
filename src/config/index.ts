export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceKey: process.env.SUPABASE_SERVICE_KEY || "",
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || "",
    fromEmail: process.env.SENDGRID_FROM_EMAIL || "",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY || "",
    activityLogDb: process.env.NOTION_ACTIVITY_LOG || "",
    filingsDb: process.env.NOTION_FILINGS_DB || "",
  },
};
