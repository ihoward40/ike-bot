# IKE BOT – Trust Automation Engine

A comprehensive Trust Navigator API built with Express.js and Supabase, providing CRUD operations for managing trust-related data including beneficiaries, disputes, and billing alerts.

## Features

- **Express.js Backend**: RESTful API with TypeScript
- **Supabase Integration**: PostgreSQL database with real-time capabilities
- **Trust Navigator CRUD Operations**:
  - Beneficiaries management
  - Disputes tracking
  - Billing alerts system
- **Database Migrations**: SQL schema files for easy deployment
- **Testing Suite**: Jest and Supertest for comprehensive API testing
- **CI/CD**: GitHub Actions workflow for automated testing

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for database)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ihoward40/ike-bot.git
   cd ike-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Update the following required variables in `.env`:
   ```env
   PORT=3000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up the database**
   
   Run the migration files in your Supabase project:
   - Navigate to your Supabase dashboard → SQL Editor
   - Execute each migration file in `supabase/migrations/` in order:
     - `001_create_beneficiaries_table.sql`
     - `002_create_disputes_table.sql`
     - `003_create_billing_alerts_table.sql`
   
   Or use the Supabase CLI:
   ```bash
   supabase db push
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
The server will start at `http://localhost:3000` with hot reloading enabled.

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

### Beneficiaries
- `GET /api/beneficiaries` - Get all beneficiaries
- `GET /api/beneficiaries/:id` - Get a specific beneficiary
- `POST /api/beneficiaries` - Create a new beneficiary
- `PUT /api/beneficiaries/:id` - Update a beneficiary
- `DELETE /api/beneficiaries/:id` - Delete a beneficiary

### Disputes
- `GET /api/disputes` - Get all disputes
- `GET /api/disputes/:id` - Get a specific dispute
- `POST /api/disputes` - Create a new dispute
- `PUT /api/disputes/:id` - Update a dispute
- `DELETE /api/disputes/:id` - Delete a dispute

### Billing Alerts
- `GET /api/billing-alerts` - Get all billing alerts
- `GET /api/billing-alerts/:id` - Get a specific billing alert
- `POST /api/billing-alerts` - Create a new billing alert
- `PUT /api/billing-alerts/:id` - Update a billing alert
- `DELETE /api/billing-alerts/:id` - Delete a billing alert

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
ike-bot/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── controllers/
│   │   ├── beneficiaryController.ts
│   │   ├── disputeController.ts
│   │   └── billingAlertController.ts
│   ├── models/
│   │   └── types.ts              # TypeScript interfaces
│   ├── routes/
│   │   ├── beneficiaryRoutes.ts
│   │   ├── disputeRoutes.ts
│   │   └── billingAlertRoutes.ts
│   ├── middleware/
│   │   └── errorHandler.ts      # Error handling middleware
│   └── server.ts                 # Main application entry point
├── supabase/
│   └── migrations/               # Database schema migrations
├── test/                         # Test files
├── .env.example                  # Environment variables template
├── jest.config.js               # Jest configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Runs on push to `main` or `develop` branches
- Tests on Node.js 18.x and 20.x
- Executes build and test commands
- Generates test coverage reports

## Database Schema

See `supabase/migrations/README.md` for detailed information about the database schema and migration instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Legacy Python Application

The repository also contains a legacy Python application (`main.py`) that handles:
- Notion logging + archiving
- Gmail PDF delivery
- Google Drive uploads
- Daily email digest
- Form intake + webhook endpoint

To run the legacy Python app:
```bash
pip install -r requirements.txt
python main.py
```
