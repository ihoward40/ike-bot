# Development Environment Setup

This document provides comprehensive setup instructions for the IKE-BOT Trust Automation Engine and its dependencies.

## Prerequisites

- Python 3.8+
- Node.js 16+
- Git
- Access to GitLab for trust-navigator-api

## Repository Setup

### 1. Clone IKE-BOT Repository

```bash
git clone https://github.com/ihoward40/ike-bot.git
cd ike-bot
```

### 2. Clone Trust Navigator API

The Trust Navigator API is a required dependency for the full trust automation system. Clone it alongside the ike-bot repository.

**Recommended directory structure:**
```
/your-workspace/
  ├── ike-bot/
  └── trust-navigator-api/
```

**Clone the API:**

Using SSH (requires SSH key setup):
```bash
cd ..
git clone git@gitlab.com:howard-trust-systems/trust-navigator-api.git
cd trust-navigator-api
```

Or using HTTPS:
```bash
cd ..
git clone https://gitlab.com/howard-trust-systems/trust-navigator-api.git
cd trust-navigator-api
```

Follow the setup instructions in the trust-navigator-api repository to configure the API service.

### 3. Return to IKE-BOT Setup

```bash
cd ../ike-bot
```

## Python Environment Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## TypeScript Environment Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Build the TypeScript project:
```bash
npm run build
```

## Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and configure the required variables:
   - `SEND_TO_GMAIL`: Your Gmail address
   - `EMAIL_PASSWORD`: Your Gmail app password
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google service account credentials
   - `GOOGLE_DRIVE_FOLDER_ID`: Your Google Drive folder ID
   - `NOTION_API_KEY`: Your Notion API key
   - `NOTION_ACTIVITY_LOG`: Notion database ID for activity logs
   - `NOTION_FILINGS_DB`: Notion database ID for filings archive
   - `SINTRA_WEBHOOK_URL`: Webhook URL for Sintra notifications
   - `DAILY_DIGEST_EMAIL`: Email address for daily digests

## Running the Application

### Python Flask Server

```bash
python main.py
```

The Flask server will start on port 5000.

### TypeScript Node Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The Node server will start on port 3000 (or the PORT specified in .env).

## Integration with Trust Navigator API

Ensure the trust-navigator-api is running and accessible. If you plan to use the navigator features in the TypeScript components (`src/navigatorBuilder/`), you may need to add the following environment variables to your `.env` file:

```bash
# Trust Navigator API Configuration (optional - required only if using navigator features)
# TRUST_NAVIGATOR_API_URL=http://localhost:8080
# TRUST_NAVIGATOR_API_KEY=your_api_key_here
```

**Note:** The basic Flask automation features in `main.py` do not require the trust-navigator-api to be running. It's only needed if you're developing or using the TypeScript navigator integration features.

For specific configuration requirements and authentication details, refer to the `README.md` or `SETUP.md` in the trust-navigator-api repository.

## Testing the Setup

1. Test the Flask server:
```bash
curl http://localhost:5000/intake
```

2. Test the Node server:
```bash
curl http://localhost:3000/
```

You should receive JSON responses indicating the servers are running correctly.

## Troubleshooting

- **Import errors**: Ensure all dependencies are installed and virtual environment is activated
- **Port conflicts**: Change the PORT in .env or in the respective server files
- **Authentication errors**: Verify all API keys and credentials in .env are correct
- **Trust Navigator API connection**: Ensure the API is running and accessible from your environment

## Additional Resources

- [IKE-BOT README](README.md)
- Trust Navigator API documentation (see trust-navigator-api repository)
