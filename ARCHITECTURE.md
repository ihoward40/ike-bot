# IKE Bot Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         IKE Bot System                               │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │   Node.js      │  │   FastAPI      │  │    Flask       │       │
│  │   Backend      │  │   Server       │  │   Backend      │       │
│  │   (Port 3000)  │  │   (Port 8000)  │  │   (Port 5000)  │       │
│  │                │  │                │  │                │       │
│  │ • CRUD APIs    │  │ • Async APIs   │  │ • PDF Gen      │       │
│  │ • Webhooks     │  │ • Agents       │  │ • Email        │       │
│  │ • Supabase     │  │ • Structlog    │  │ • G Drive      │       │
│  │ • TypeScript   │  │ • Pydantic     │  │ • Legacy       │       │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘       │
│           │                   │                   │                │
│           └───────────────────┼───────────────────┘                │
│                               │                                    │
│                    ┌──────────▼──────────┐                        │
│                    │   SintraPrime       │                        │
│                    │   Dashboard         │                        │
│                    │   (Port 5011)       │                        │
│                    │                     │                        │
│                    │ • Event Hub         │                        │
│                    │ • Mode Management   │                        │
│                    │ • Heartbeat Monitor │                        │
│                    │ • JSON Lines Logs   │                        │
│                    └─────────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ Events & Webhooks
                                ▼
                    ┌───────────────────────┐
                    │   External Services   │
                    │                       │
                    │ • Make.com            │
                    │ • Stripe              │
                    │ • SendGrid/Postmark   │
                    │ • Notion              │
                    │ • Google Drive        │
                    └───────────────────────┘
```

## Service Responsibilities

### Node.js Backend (Port 3000)
**Technology**: TypeScript, Express, Supabase

**Responsibilities**:
- CRUD APIs for beneficiaries
- CRUD APIs for credit disputes
- Webhook routing (Stripe, Make.com, email providers)
- Database operations via Supabase
- Request logging and audit trails
- OpenAI agent tool definitions

**Key Files**:
- `src/server.ts` - Main Express server
- `src/routes/*.routes.ts` - API routes
- `src/services/*.service.ts` - Business logic
- `src/webhooks/*.webhook.ts` - Webhook handlers

### FastAPI Server (Port 8000)
**Technology**: Python, FastAPI, Uvicorn, Structlog

**Responsibilities**:
- Async agent operations
- SintraPrime event integration
- Structured logging (JSON)
- Background task processing
- Pydantic data validation
- Auto-generated OpenAPI docs

**Key Files**:
- `api_server.py` - Main FastAPI application
- Endpoints:
  - `/api/v2/run-agent` - Execute agents
  - `/api/v2/affidavit` - Create affidavits
  - `/api/v2/beneficiaries` - Beneficiary management
  - `/api/v2/disputes` - Dispute management
  - `/api/v2/events/sintra` - SintraPrime events

### Flask Backend (Port 5000)
**Technology**: Python, Flask, FPDF, Google APIs

**Responsibilities**:
- PDF generation (affidavits, documents)
- Email sending (Gmail SMTP)
- Google Drive uploads
- Legacy agent endpoints
- Form-based intake interface
- Daily digest generation

**Key Files**:
- `main.py` - Flask application
- Endpoints:
  - `/intake` - Web form for submissions
  - `/run-agent` - Legacy agent executor
  - `/digest` - Daily summary trigger
  - `/status` - Health status
  - `/event` - Receive SintraPrime events
  - `/mode` - Mode synchronization

### SintraPrime Dashboard (Port 5011)
**Technology**: Node.js, Express, Winston

**Responsibilities**:
- Central event hub
- Mode state management
- Heartbeat monitoring
- Event logging (JSON Lines)
- Service orchestration
- Blueprint fingerprinting

**Key Files**:
- `sintraprime-agent/dashboard-server.js`
- Endpoints:
  - `/event` - Receive events from all services
  - `/mode` - Get/set system mode
  - `/events` - Query event history
  - `/heartbeat` - Heartbeat updates
  - `/fingerprints` - Loaded blueprints
  - `/trigger/flask/:endpoint` - Trigger Flask

**Data Files**:
- `data/current_mode.json` - Persistent mode state
- `logs/heartbeat.log` - Heartbeat timestamp + mode
- `memory/events_YYYY-MM-DD.jsonl` - Daily event logs

## Event Flow

### 1. User Triggers Action (e.g., Submit Form)

```
User → Flask /intake → Flask /run-agent
                              │
                              ├─→ SintraPrime /event (agent_run_requested)
                              │
                              ├─→ Execute Agent (affidavit_bot)
                              │   ├─→ Generate PDF
                              │   ├─→ Log to Notion
                              │   ├─→ Send Email
                              │   └─→ Upload to Drive
                              │
                              ├─→ SintraPrime /event (agent_run_completed)
                              │
                              └─→ Return Result to User
```

### 2. Make.com Automation Triggers

```
Make.com Webhook → Node.js /webhooks/make
                              │
                              ├─→ Parse Action
                              │
                              ├─→ SintraPrime /event (webhook_received)
                              │
                              ├─→ Execute Action
                              │   └─→ Database Operation
                              │
                              └─→ Log to agent_logs
```

### 3. FastAPI Agent Execution

```
External Request → FastAPI /api/v2/run-agent
                              │
                              ├─→ SintraPrime /event (agent_requested)
                              │
                              ├─→ Process in Background Task
                              │   ├─→ Execute Agent Logic
                              │   ├─→ Log to Notion
                              │   └─→ SintraPrime /event (agent_completed)
                              │
                              └─→ Return Immediate Response
```

## Mode Management

Modes represent the system's operational state:

| Mode | Description | Triggers |
|------|-------------|----------|
| `idle` | No active operations | Default state |
| `enforcement_active` | Enforcement action in progress | Make blueprint execution |
| `monitoring` | Passive monitoring | Scheduled jobs |
| `maintenance` | System maintenance | Manual trigger |
| `error` | Error requiring attention | Exception handling |

**Mode Changes**:
- Any service can request mode change via `POST /mode`
- Mode persisted to `data/current_mode.json`
- Heartbeat updated with new mode
- Mode change logged as event

## Data Flow

### Event Logging (JSON Lines)

```json
{"event_type":"affidavit_created","source":"flask_backend","payload":{...},"timestamp":"2025-12-13T13:00:00Z"}
{"event_type":"mode_changed","from_mode":"idle","to_mode":"enforcement_active","timestamp":"2025-12-13T13:01:00Z"}
```

**Benefits**:
- One event per line (easy parsing)
- Daily rotation (automatic archiving)
- Append-only (never overwrites)
- JSON format (structured querying)

### Heartbeat Monitoring

```
2025-12-13T13:00:00.000Z
enforcement_active
```

**Purpose**:
- Proof-of-life for SintraPrime
- Updated every 60 seconds
- Contains timestamp + current mode
- External monitoring can watch file

## Windows Integration

### Scheduled Tasks

| Task Name | Type | Schedule |
|-----------|------|----------|
| IkeBot-SintraDashboard | Service | At Startup |
| IkeBot-FastAPI | Service | At Startup |
| IkeBot-Flask | Service | At Startup |
| IkeBot-NodeBackend | Service | At Startup |
| IkeBot-Heartbeat | Monitor | Every 1 minute |
| IkeBot-DailyDigest | Job | Daily at 8 AM |

**Configuration**:
- Auto-restart on failure (up to 3 times)
- Restart interval: 1 minute
- No execution time limit for services
- Run with highest privileges

### Registration

```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File scripts/register_tasks.ps1
```

## Make.com Blueprint

### Verizon Enforcement v1

**File**: `src/config/templates/verizon_enforcement_v1.blueprint.json`

**Flow**:
1. **Webhook Trigger** - Receives case data
2. **Notify SintraPrime** - Send event to dashboard
3. **Call IKE Bot API** - Execute enforcement agent
4. **Set Variables** - Store results
5. **Update Mode** - Set mode to `enforcement_active`
6. **Respond** - Return results to webhook caller

**Template Variables**:
- `{{CASE_ID}}` - Unique case identifier
- `{{WEBHOOK_ID}}` - Make.com webhook ID
- `{{SINTRA_DASHBOARD_URL}}` - Dashboard URL (default: http://localhost:5011)
- `{{SINTRA_API_KEY}}` - API key for authentication
- `{{IKE_BOT_API_URL}}` - FastAPI URL (default: http://localhost:8000)

## Security Considerations

### Current Implementation
- ✅ Input validation (Pydantic, Zod)
- ✅ Structured logging and audit trails
- ✅ Mock clients for development
- ✅ Environment variable configuration

### Production Recommendations
- Add API key authentication
- Implement rate limiting (express-rate-limit)
- Enable HTTPS/TLS
- Restrict network access (firewall rules)
- Use Windows Services instead of Scheduled Tasks
- Set up monitoring and alerting
- Regular security audits

See [SECURITY.md](SECURITY.md) for complete details.

## Development Workflow

1. **Start all services**:
   ```bash
   # Terminal 1
   cd sintraprime-agent && npm run dev
   
   # Terminal 2
   python api_server.py
   
   # Terminal 3
   python main.py
   
   # Terminal 4
   npm run dev
   ```

2. **Verify integration**:
   ```bash
   npm run verify:blueprint
   ```

3. **Monitor events**:
   ```bash
   curl http://localhost:5011/events?limit=10
   ```

4. **Test event flow**:
   ```bash
   curl -X POST http://localhost:5000/run-agent \
     -H "Content-Type: application/json" \
     -d '{"agent":"affidavit_bot","payload":{"statement":"Test"}}'
   ```

## Monitoring & Observability

### Health Checks
- Node.js: `GET http://localhost:3000/`
- FastAPI: `GET http://localhost:8000/`
- Flask: `GET http://localhost:5000/status`
- SintraPrime: `GET http://localhost:5011/health`

### Logs
- SintraPrime: `sintraprime-agent/logs/sintra-dashboard.log`
- Events: `sintraprime-agent/memory/events_YYYY-MM-DD.jsonl`
- Heartbeat: `sintraprime-agent/logs/heartbeat.log`
- Flask: stdout/stderr
- Node.js: Pino structured logs
- FastAPI: Structlog JSON logs

### Metrics
- Event count per day
- Mode transitions
- Heartbeat uptime
- API response times (logged in events)
- Error rates

## Future Enhancements

1. **Authentication & Authorization**
   - JWT tokens
   - API keys
   - Role-based access control

2. **Advanced Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Alert manager

3. **Scalability**
   - Load balancing
   - Redis caching
   - Message queue (RabbitMQ/Redis)

4. **Database**
   - Connect real Supabase instance
   - Add PostgreSQL connection pooling
   - Implement database backups

5. **Testing**
   - Unit tests for all services
   - Integration tests
   - End-to-end automation tests

## Support

For setup issues, see:
- [WINDOWS_SETUP.md](WINDOWS_SETUP.md) - Complete Windows guide
- [SECURITY.md](SECURITY.md) - Security recommendations
- [README.md](README.md) - General documentation
- [FASTAPI_README.md](FASTAPI_README.md) - FastAPI details
- [sintraprime-agent/README.md](sintraprime-agent/README.md) - Dashboard details
