# SintraPrime Agent

Autonomous agent system with dashboard for managing modes, events, and integrations.

## Features

- **Dashboard Server** - HTTP API on port 5011
- **Mode Management** - Persistent mode state with transitions
- **Event Logging** - JSON Lines format with daily rotation
- **Heartbeat Monitoring** - Proof-of-life updates every 60s
- **IKE Bot Integration** - Bidirectional webhook piping
- **Make.com Integration** - Blueprint fingerprinting

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Dashboard

```bash
npm run dashboard
```

Dashboard will be available at `http://localhost:5011`

## API Endpoints

### Health & Status
- `GET /` - Service info
- `GET /health` - Health check
- `GET /heartbeat` - Update heartbeat

### Mode Management
- `GET /mode` - Get current mode
- `POST /mode` - Change mode
  ```json
  {
    "mode": "enforcement_active",
    "metadata": {"case_id": "CASE-001"}
  }
  ```

### Event Management
- `POST /event` - Receive event
- `GET /events` - Get event history

### Integration
- `POST /trigger/flask/:endpoint` - Trigger Flask endpoint
- `GET /fingerprints` - Get loaded blueprints

## File Structure

```
sintraprime-agent/
├── dashboard-server.js    # Main dashboard server
├── data/                  # Mode persistence
│   └── current_mode.json
├── logs/                  # Heartbeat and logs
│   ├── heartbeat.log
│   └── sintra-dashboard.log
├── memory/                # Event history
│   └── events_YYYY-MM-DD.jsonl
├── package.json
└── .env.example
```

## Configuration

Key environment variables:

```bash
# Server
SINTRA_PORT=5011
SINTRA_HOST=0.0.0.0

# Files
MODE_FILE=./data/current_mode.json
HEARTBEAT_FILE=./logs/heartbeat.log
HEARTBEAT_INTERVAL=60

# IKE Bot URLs
IKE_BOT_FLASK_URL=http://localhost:5000
IKE_BOT_FASTAPI_URL=http://localhost:8000
IKE_BOT_NODE_URL=http://localhost:3000
```

## Security

⚠️ **Important Security Notes**:

1. **Rate Limiting**: The dashboard does not currently implement rate limiting on file system access routes. For production:
   - Add `express-rate-limit` middleware
   - Restrict access via firewall rules
   - Run on localhost only
   - Use reverse proxy with rate limiting

2. **Authentication**: Enable API key authentication:
   ```bash
   ENABLE_AUTH=true
   API_KEY=your-strong-api-key-here
   ```

3. **Network**: For production, bind to localhost only:
   ```bash
   SINTRA_HOST=127.0.0.1
   ```

See `../SECURITY.md` for complete security recommendations.

## Mode States

Common mode states:

- `idle` - No active operations
- `enforcement_active` - Enforcement action in progress
- `monitoring` - Passive monitoring
- `maintenance` - System maintenance
- `error` - Error state requiring attention

Modes are persisted to `data/current_mode.json` and survive restarts.

## Event Logging

Events are logged to `memory/events_YYYY-MM-DD.jsonl` in JSON Lines format:

```json
{"event_type":"affidavit_created","source":"flask_backend","timestamp":"2025-12-13T13:00:00Z"}
{"event_type":"mode_changed","from_mode":"idle","to_mode":"enforcement_active","timestamp":"2025-12-13T13:01:00Z"}
```

## Heartbeat

The heartbeat file is updated every 60 seconds:

```
2025-12-13T13:00:00.000Z
enforcement_active
```

Monitor this file to ensure the service is running.

## Integration with IKE Bot

The dashboard can:

1. **Receive events** from Flask, FastAPI, and Node.js backends
2. **Trigger Flask endpoints** via `/trigger/flask/:endpoint`
3. **Forward events** to IKE Bot services
4. **Track scenarios** via blueprint fingerprinting

## Troubleshooting

### Dashboard won't start
- Check port 5011 is not in use: `lsof -i :5011`
- Verify dependencies: `npm install`
- Check logs: `tail -f logs/sintra-dashboard.log`

### Events not logging
- Verify `memory/` directory exists and is writable
- Check disk space
- Review dashboard logs for errors

### Heartbeat not updating
- Check heartbeat interval in `.env`
- Verify `logs/` directory is writable
- Ensure dashboard process is running

### Mode not persisting
- Verify `data/` directory exists and is writable
- Check `data/current_mode.json` permissions
- Review error logs

## Development

Run in development mode with auto-reload:

```bash
npm run dev
```

## Production Deployment

Recommended setup:

1. Use process manager (PM2, systemd)
2. Enable authentication
3. Add rate limiting
4. Run behind reverse proxy
5. Enable HTTPS
6. Set up monitoring
7. Configure log rotation

Example PM2 config:

```json
{
  "name": "sintraprime-dashboard",
  "script": "dashboard-server.js",
  "instances": 1,
  "autorestart": true,
  "watch": false,
  "max_memory_restart": "1G",
  "env": {
    "NODE_ENV": "production",
    "SINTRA_PORT": 5011,
    "SINTRA_HOST": "127.0.0.1"
  }
}
```

## License

MIT
