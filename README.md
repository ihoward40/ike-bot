# IKE BOT v1 – Trust Enforcement & Automation API

A comprehensive Trust Enforcement & Automation API built with TypeScript, Express, and modern cloud services.

## Features

- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 📊 **Supabase Database** - PostgreSQL database with real-time capabilities
- 📧 **SendGrid Email Integration** - Automated email notifications
- 💳 **Stripe Payment Processing** - Payment intent creation and webhook handling
- 📝 **Notion Logging** - Activity logging and archiving to Notion databases
- 🎯 **Comprehensive API Endpoints**:
  - Beneficiaries management
  - Trust notices
  - Disputes tracking
  - Billing alerts
  - Webhook ingestion
- 🎨 **Modern Frontend UI** - Simple preview interface for testing
- 🛡️ **Security** - Error handling, request logging, and input validation

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken + bcrypt)
- **Email**: SendGrid
- **Payments**: Stripe
- **Logging**: Notion API
- **Validation**: express-validator

## Setup

### Prerequisites
- Node.js 18+ and npm
- A Supabase account and project
- SendGrid API key (optional)
- Stripe API key (optional)
- Notion API key and database IDs (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ihoward40/ike-bot.git
   cd ike-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your credentials:
   - `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (required)
   - `JWT_SECRET` (required for authentication)
   - `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` (optional)
   - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (optional)
   - `NOTION_API_KEY`, `NOTION_ACTIVITY_LOG`, `NOTION_FILINGS_DB` (optional)

4. **Set up database schema**
   
   See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete SQL setup instructions. Run the SQL commands in your Supabase SQL editor.

5. **Build the application**
   ```bash
   npm run build
   ```

6. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

7. **Access the application**
   - API: http://localhost:3000
   - Frontend UI: http://localhost:3000/client
   - Health check: http://localhost:3000/health

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe" (optional)
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Beneficiaries

All beneficiary endpoints require authentication (Bearer token).

#### List Beneficiaries
```http
GET /api/beneficiaries
Authorization: Bearer <token>
```

#### Get Single Beneficiary
```http
GET /api/beneficiaries/:id
Authorization: Bearer <token>
```

#### Create Beneficiary
```http
POST /api/beneficiaries
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "relationship": "Daughter"
}
```

#### Update Beneficiary
```http
PUT /api/beneficiaries/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+0987654321"
}
```

#### Delete Beneficiary
```http
DELETE /api/beneficiaries/:id
Authorization: Bearer <token>
```

### Trust Notices

#### List Trust Notices
```http
GET /api/notices
Authorization: Bearer <token>
```

#### Create Trust Notice
```http
POST /api/notices
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Annual Trust Review",
  "description": "Please review the annual trust documents",
  "notice_type": "review",
  "beneficiary_id": "uuid" (optional),
  "due_date": "2025-12-31T00:00:00Z" (optional)
}
```

### Disputes

#### List Disputes
```http
GET /api/disputes?status=open
Authorization: Bearer <token>
```

#### Create Dispute
```http
POST /api/disputes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Dispute Title",
  "description": "Detailed description",
  "priority": "high",
  "beneficiary_id": "uuid" (optional)
}
```

### Billing Alerts

#### List Billing Alerts
```http
GET /api/billing?status=active
Authorization: Bearer <token>
```

#### Create Billing Alert
```http
POST /api/billing
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Payment Due",
  "description": "Monthly trust fee",
  "amount": 10000,
  "alert_type": "payment_due",
  "beneficiary_id": "uuid" (optional),
  "due_date": "2025-01-15T00:00:00Z" (optional)
}
```
Note: Amount is in cents (10000 = $100.00)

### Webhooks

#### Generic Webhook Ingestion
```http
POST /api/webhooks/ingest
Content-Type: application/json

{
  "event_type": "custom_event",
  "payload": { "data": "any" },
  "source": "external_system"
}
```

#### Stripe Webhook
```http
POST /api/webhooks/stripe
Stripe-Signature: <signature>
Content-Type: application/json

(Stripe event payload)
```

#### List Webhook Events
```http
GET /api/webhooks/events?source=stripe&processed=false
```

## Frontend UI

The application includes a simple frontend UI for testing and demonstration purposes:

- Access at: http://localhost:3000/client
- Features:
  - User registration and login
  - View beneficiaries, notices, disputes, and billing alerts
  - Responsive design with modern styling
  - Real-time API integration

## Project Structure

```
ike-bot/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Supabase connection
│   │   └── index.ts     # App configuration
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication
│   │   ├── errorHandler.ts
│   │   └── logger.ts
│   ├── routes/          # API route handlers
│   │   ├── auth.ts
│   │   ├── beneficiaries.ts
│   │   ├── billing.ts
│   │   ├── disputes.ts
│   │   ├── notices.ts
│   │   └── webhooks.ts
│   ├── services/        # External service integrations
│   │   ├── auth.ts      # Auth service
│   │   ├── notion.ts    # Notion API client
│   │   ├── sendgrid.ts  # Email service
│   │   └── stripe.ts    # Payment processing
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── clients/         # Legacy API clients
│   ├── navigatorBuilder/
│   └── server.ts        # Main application entry
├── client/              # Frontend UI
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── dist/                # Compiled JavaScript (generated)
├── main.py              # Legacy Python Flask app
├── DATABASE_SCHEMA.md   # Database setup guide
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Build
```bash
npm run build
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

## Legacy Python App

The repository also contains a legacy Python Flask application (`main.py`) with additional trust automation features:
- Affidavit generation
- PDF creation and delivery
- Google Drive integration
- Daily email digests

To run the Python app:
```bash
pip install -r requirements.txt
python main.py
```

## Security Considerations

1. **Never commit** the `.env` file to version control
2. Use **strong JWT secrets** in production
3. Enable **Row Level Security (RLS)** in Supabase
4. Validate **webhook signatures** (especially Stripe)
5. Use **HTTPS** in production
6. Regularly **rotate API keys** and secrets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[MIT License](LICENSE) - See LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub or contact the maintainer.

---

Built with ❤️ by [ihoward40](https://github.com/ihoward40)
