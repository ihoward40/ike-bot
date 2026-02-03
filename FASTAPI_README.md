# FastAPI Server with SintraPrime Integration

## Overview

The new FastAPI server (`api_server.py`) provides a modern, async API with full SintraPrime event integration, structured logging, and improved performance.

## Features

- ✅ **Async/Await Support** - Built on FastAPI and Uvicorn for high performance
- ✅ **SintraPrime Events** - All endpoints send events to SintraPrime webhook
- ✅ **Structured Logging** - Using structlog for JSON-formatted logs
- ✅ **Background Tasks** - Non-blocking event notifications
- ✅ **Pydantic Validation** - Strong type validation for all requests
- ✅ **OpenAPI Documentation** - Auto-generated API docs at `/docs`
- ✅ **Notion Integration** - Automatic logging to Notion databases

## Installation

Dependencies are already in `requirements.txt`:
```bash
pip install -r requirements.txt
```

## Configuration

Set these environment variables (in `.env` file):

```bash
# SintraPrime Integration
SINTRA_WEBHOOK_URL=https://your-sintra-webhook-url

# Notion Integration (optional)
NOTION_API_KEY=secret_xxxxx
NOTION_ACTIVITY_LOG=database_id_here
NOTION_FILINGS_DB=database_id_here

# Server Configuration
FASTAPI_PORT=8000
```

## Running the Server

### Option 1: Using the startup script
```bash
./start_api.sh fastapi
```

### Option 2: Direct Python
```bash
python3 api_server.py
```

### Option 3: Using Uvicorn directly
```bash
uvicorn api_server:app --reload --port 8000
```

## API Endpoints

### Health Checks
- `GET /` - Basic health check
- `GET /api/v2/health/sintra` - Check SintraPrime connection

### Agent Operations
- `POST /api/v2/run-agent` - Run any agent with payload
- `POST /api/v2/affidavit` - Create an affidavit
- `POST /api/v2/beneficiaries` - Create a beneficiary
- `POST /api/v2/disputes` - Create a credit dispute

### Event Management
- `POST /api/v2/events/sintra` - Manually send SintraPrime event

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## SintraPrime Event Integration

All endpoints automatically send events to SintraPrime:

### Events Sent

| Endpoint | Event Type | Description |
|----------|-----------|-------------|
| POST /api/v2/run-agent | `{agent}_completed` | Agent execution completed |
| POST /api/v2/run-agent | `{agent}_failed` | Agent execution failed |
| POST /api/v2/affidavit | `affidavit_created` | Affidavit was created |
| POST /api/v2/beneficiaries | `beneficiary_created` | New beneficiary added |
| POST /api/v2/disputes | `dispute_created` | New dispute filed |

### Event Payload Format

```json
{
  "event_type": "affidavit_created",
  "payload": {
    "statement": "...",
    "notice_id": "IRS-2024-001"
  },
  "timestamp": "2024-12-13T13:00:00",
  "source": "ike-bot-api"
}
```

## Example Requests

### Create an Affidavit
```bash
curl -X POST http://localhost:8000/api/v2/affidavit \
  -H "Content-Type: application/json" \
  -d '{
    "statement": "I hereby declare under penalty of perjury...",
    "notice_id": "IRS-2024-001",
    "response": "Accepted"
  }'
```

### Run an Agent
```bash
curl -X POST http://localhost:8000/api/v2/run-agent \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "affidavit_bot",
    "payload": {
      "statement": "My statement",
      "notice_id": "IRS-2024-002"
    }
  }'
```

### Create a Beneficiary
```bash
curl -X POST http://localhost:8000/api/v2/beneficiaries \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-0100",
    "relationship": "Primary"
  }'
```

### Create a Dispute
```bash
curl -X POST http://localhost:8000/api/v2/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary_id": "ben_123456",
    "creditor_name": "Example Credit Corp",
    "dispute_reason": "This account does not belong to me",
    "dispute_type": "not_mine"
  }'
```

### Send Custom SintraPrime Event
```bash
curl -X POST http://localhost:8000/api/v2/events/sintra \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "custom_event",
    "payload": {
      "data": "anything you want"
    }
  }'
```

## Structured Logging

All logs are output in JSON format for easy parsing:

```json
{
  "event": "request_completed",
  "method": "POST",
  "path": "/api/v2/affidavit",
  "status_code": 200,
  "duration_seconds": 0.123,
  "timestamp": "2024-12-13T13:00:00.000000Z"
}
```

## Architecture Differences

### FastAPI Server (api_server.py) vs Flask Server (main.py)

| Feature | FastAPI | Flask |
|---------|---------|-------|
| Port | 8000 | 5000 |
| Performance | Async/High | Sync/Standard |
| Logging | Structured (JSON) | Standard |
| SintraPrime | ✅ All endpoints | ✅ Selected |
| Validation | Pydantic models | Manual |
| Docs | Auto-generated | Manual |
| Background Tasks | Built-in | Manual |

## Integration with Existing System

The FastAPI server complements the existing TypeScript/Node.js backend:

- **Node.js Backend** (port 3000): Database CRUD, webhooks, logging
- **FastAPI Server** (port 8000): Agent operations, SintraPrime integration
- **Flask Server** (port 5000): Legacy PDF generation, email, Google Drive

All three can run simultaneously on different ports.

## Development

### Hot Reload
```bash
uvicorn api_server:app --reload --port 8000
```

### View Logs
Logs are automatically structured. Pipe to `jq` for pretty printing:
```bash
python3 api_server.py 2>&1 | jq .
```

## Production Deployment

### Using Gunicorn with Uvicorn workers
```bash
gunicorn api_server:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Using systemd
Create `/etc/systemd/system/ike-bot-api.service`:
```ini
[Unit]
Description=IKE Bot FastAPI Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ike-bot
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/uvicorn api_server:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## Testing

Test the SintraPrime integration:
```bash
# Check if SintraPrime is configured
curl http://localhost:8000/api/v2/health/sintra

# Send a test event
curl -X POST http://localhost:8000/api/v2/events/sintra \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test_event",
    "payload": {"test": true}
  }'
```

## Troubleshooting

### SintraPrime events not sending
1. Check `SINTRA_WEBHOOK_URL` is set
2. Test connectivity: `curl -X GET $SINTRA_WEBHOOK_URL`
3. Check logs for `sintra_event_failed` messages

### Notion logging not working
1. Verify `NOTION_API_KEY` is set
2. Verify database IDs are correct
3. Check Notion API permissions

### Port already in use
Change the port:
```bash
FASTAPI_PORT=8001 python3 api_server.py
```

## Next Steps

1. Add database integration (PostgreSQL/Supabase)
2. Add authentication (JWT tokens)
3. Add rate limiting
4. Add Prometheus metrics
5. Add integration tests
6. Add WebSocket support for real-time events
