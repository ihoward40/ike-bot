# IKE-BOT Setup Guide

## Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- Supabase account and project
- Notion account and API key
- Make.com account (optional, for webhooks)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ihoward40/ike-bot.git
   cd ike-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your credentials:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Authentication
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=24h

   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Notion Configuration
   NOTION_API_KEY=your_notion_api_key
   NOTION_ACTIVITY_LOG=your_activity_log_db_id
   NOTION_FILINGS_DB=your_filings_db_id

   # Make.com Configuration
   MAKE_BASE_URL=https://api.make.com/v2
   MAKE_API_TOKEN=your-make-api-token
   MAKE_WEBHOOK_SECRET=your-webhook-secret
   ```

## Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Create the users table:**
   ```sql
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     password TEXT NOT NULL,
     role TEXT DEFAULT 'user',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Create the filings table:**
   ```sql
   CREATE TABLE filings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     type TEXT NOT NULL,
     status TEXT DEFAULT 'Draft',
     content JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

4. **Create the documents table:**
   ```sql
   CREATE TABLE documents (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     type TEXT,
     url TEXT,
     content JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Create the logs table:**
   ```sql
   CREATE TABLE logs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE SET NULL,
     action TEXT NOT NULL,
     resource TEXT,
     metadata JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

6. **Get your API keys** from Supabase project settings and add them to `.env`

## Notion Setup

1. **Create a Notion integration:**
   - Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Give it a name (e.g., "IKE-BOT")
   - Copy the "Internal Integration Token"

2. **Create databases:**
   - Create an "Activity Log" database in Notion
   - Create a "Filings" database in Notion
   - Share both databases with your integration

3. **Get database IDs:**
   - Open each database in Notion
   - Copy the database ID from the URL
   - Format: `https://notion.so/workspace/{database-id}?v=...`

4. **Update .env** with your Notion API key and database IDs

## Make.com Setup (Optional)

1. **Create a Make.com account** at [make.com](https://www.make.com)

2. **Create a webhook scenario:**
   - Create a new scenario
   - Add a webhook trigger
   - Configure it to send data to your IKE-BOT API

3. **Update .env** with Make.com credentials

## Development

### Running in development mode:
```bash
npm run dev
```

The server will start on `http://localhost:3000` with auto-reload on file changes.

### Building for production:
```bash
npm run build
```

### Running in production mode:
```bash
npm start
```

## Testing the API

### Using curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (replace TOKEN with actual JWT)
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman or Thunder Client:

Import the API endpoints and test them interactively. See [API.md](./API.md) for all available endpoints.

## Project Structure

```
ike-bot/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts      # Main config
│   │   ├── supabase.ts   # Supabase client
│   │   └── notion.ts     # Notion client
│   ├── controllers/      # Request handlers
│   │   ├── authController.ts
│   │   ├── crudController.ts
│   │   ├── notionController.ts
│   │   └── webhookController.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── errorHandler.ts
│   │   └── validator.ts
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   ├── crud.routes.ts
│   │   ├── notion.routes.ts
│   │   ├── webhook.routes.ts
│   │   └── index.ts
│   ├── services/         # Business logic
│   │   ├── authService.ts
│   │   ├── crudService.ts
│   │   └── notionService.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── clients/          # External API clients
│   └── server.ts         # Main server file
├── dist/                 # Compiled JavaScript (generated)
├── docs/                 # Documentation
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions CI/CD
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Port already in use
If port 3000 is already in use, change the `PORT` in your `.env` file:
```env
PORT=3001
```

### Supabase connection issues
- Verify your Supabase URL and keys are correct
- Check that your IP is not blocked by Supabase
- Ensure tables are created properly

### Notion API errors
- Verify the integration has access to your databases
- Check that database IDs are correct
- Ensure the integration token is valid

### Build errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check that you're using Node.js 18.x or 20.x

## Next Steps

- Read [API.md](./API.md) for complete API documentation
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions
- Configure CI/CD pipelines for your environment
- Set up monitoring and logging
- Add rate limiting for production use
