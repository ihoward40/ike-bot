# IKE-BOT – Trust Automation Engine

A fully functional Node.js/TypeScript API for trust automation, featuring affidavit generation, UCC lien automation, IRS rebuttals, FOIA requests, and comprehensive trust logging.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 💾 **Supabase Integration** - Robust database operations with PostgreSQL
- 📝 **CRUD Operations** - Generic CRUD modules for filings, documents, and logs
- 🔗 **Make.com Webhooks** - Webhook router for automation workflows
- 📊 **Notion Integration** - Activity logging and filing management
- 🚀 **TypeScript** - Full type safety and modern JavaScript features
- 🔄 **CI/CD Ready** - GitHub Actions workflow included
- 📚 **Comprehensive Documentation** - API docs, setup guide, and deployment instructions

## Tech Stack

- **Runtime**: Node.js 18.x / 20.x
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken)
- **Integrations**: Notion API, Make.com
- **Security**: Helmet, CORS, bcryptjs

## Quick Start

### Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- Supabase account
- Notion account (for logging features)

### Installation

```bash
# Clone the repository
git clone https://github.com/ihoward40/ike-bot.git
cd ike-bot

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Build the project
npm run build

# Start the server
npm start
```

For development with hot reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)

### CRUD Operations
- `POST /api/filings` - Create filing
- `GET /api/filings` - Get all filings
- `GET /api/filings/:id` - Get filing by ID
- `PUT /api/filings/:id` - Update filing
- `DELETE /api/filings/:id` - Delete filing

Similar endpoints available for `/api/documents` and `/api/logs`

### Notion Integration
- `POST /api/notion/activity` - Log activity
- `POST /api/notion/filings` - Create filing in Notion
- `GET /api/notion/database/:id` - Get database entries
- `PATCH /api/notion/page/:id` - Update Notion page

### Webhooks
- `POST /api/webhooks/make` - Make.com webhook endpoint
- `GET /api/webhooks/make` - Webhook documentation

### Health Check
- `GET /api/health` - API health status

## Project Structure

```
ike-bot/
├── src/
│   ├── config/           # Configuration (Supabase, Notion)
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── clients/          # External API clients
│   └── server.ts         # Main server
├── docs/                 # Documentation
│   ├── API.md            # API documentation
│   ├── SETUP.md          # Setup guide
│   └── DEPLOYMENT.md     # Deployment guide
├── .github/workflows/    # CI/CD pipelines
├── dist/                 # Compiled output
└── package.json
```

## Environment Variables

Create a `.env` file with:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Notion
NOTION_API_KEY=your-notion-key
NOTION_ACTIVITY_LOG=your-activity-log-db-id
NOTION_FILINGS_DB=your-filings-db-id

# Make.com
MAKE_BASE_URL=https://api.make.com/v2
MAKE_API_TOKEN=your-make-token
MAKE_WEBHOOK_SECRET=your-webhook-secret
```

See `.env.example` for complete list.

## Documentation

- **[Setup Guide](docs/SETUP.md)** - Detailed installation and configuration
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

## CI/CD

The project includes GitHub Actions workflow that:
- Runs on push to `main` and `develop` branches
- Tests on multiple Node.js versions
- Builds TypeScript code
- Performs security audits
- Supports automated deployment

## Development

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production server
npm start
```

## Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Security

- JWT-based authentication
- Password hashing with bcryptjs
- Helmet for security headers
- CORS configuration
- Input validation
- Error handling middleware

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:
- Open an [issue](https://github.com/ihoward40/ike-bot/issues)
- Check the [documentation](docs/)

## License

MIT License - see LICENSE file for details

## Legacy Python Implementation

The repository also contains a legacy Python implementation (`main.py`) for backward compatibility. The Node.js/TypeScript API is the recommended implementation going forward.
