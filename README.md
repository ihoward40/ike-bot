# IKE BOT – Trust Automation Engine

This repo powers affidavit generation, UCC lien automation, IRS rebuttals, FOIA requests, and trust logging with:
- Notion logging + archiving
- Gmail PDF delivery
- Google Drive uploads
- Daily email digest
- Form intake + webhook endpoint

## Setup

### TypeScript/Node.js Backend (src/)
1. Clone this repo
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run locally: `npm start` (or `npm run dev` for development)
5. Health check: `http://localhost:3000/api/health`

### Python Scripts
1. Add `.env` file from `.env.example`
2. Install dependencies: `pip install -r requirements.txt`
3. Run locally: `python main.py`

## Deployment

The repository is configured for deployment to Railway and Render:

### Environment Variables
Set these environment variables on your deployment platform:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `NODE_ENV`: Set to `production`
- `PORT`: Port number (e.g., 4000)

### Build & Start Commands
- **Build**: `npm install && npm run build`
- **Start**: `npm start`

### Health Check Endpoint
- **URL**: `/api/health`
- **Response**: `{"status":"ok","service":"trust-navigator-api"}`
