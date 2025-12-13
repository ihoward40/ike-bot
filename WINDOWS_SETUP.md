# Windows Setup Guide

Complete setup guide for running IKE Bot on Windows with scheduled tasks.

## Prerequisites

1. **Python 3.14** installed at `C:\Python314\python.exe`
2. **Node.js 18+** installed (default location)
3. **Administrator access** for creating scheduled tasks

## Quick Start

### 1. Install Python Dependencies

```powershell
C:\Python314\python.exe -m pip install -r requirements.txt
```

This installs:
- Flask
- FastAPI
- uvicorn
- structlog
- And other dependencies

### 2. Install Node.js Dependencies

```powershell
npm install
cd sintraprime-agent
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials (or use dummy values for testing).

### 4. Register Windows Scheduled Tasks

Run as Administrator:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/register_tasks.ps1
```

This creates 6 scheduled tasks:

| Task | Description | Trigger |
|------|-------------|---------|
| `IkeBot-SintraDashboard` | SintraPrime dashboard server (port 5011) | At Startup |
| `IkeBot-FastAPI` | FastAPI server (port 8000) | At Startup |
| `IkeBot-Flask` | Flask server (port 5000) | At Startup |
| `IkeBot-NodeBackend` | Node.js TypeScript backend (port 3000) | At Startup |
| `IkeBot-Heartbeat` | Heartbeat monitor | Every 1 minute |
| `IkeBot-DailyDigest` | Daily filing digest | Daily at 8 AM |

### 5. Start Services

**Option A: Using Task Scheduler**

```powershell
# Open Task Scheduler
taskschd.msc

# Right-click each task and select "Run"
```

**Option B: Manually**

```powershell
# Terminal 1: SintraPrime Dashboard
cd sintraprime-agent
npm run dashboard

# Terminal 2: FastAPI Server
python api_server.py

# Terminal 3: Flask Server
python main.py

# Terminal 4: Node.js Backend
npm run dev
```

## Service URLs

Once running, access:

- **SintraPrime Dashboard**: http://localhost:5011
- **FastAPI Server**: http://localhost:8000
- **Flask Server**: http://localhost:5000
- **Node.js Backend**: http://localhost:3000

### API Documentation

- **FastAPI Swagger UI**: http://localhost:8000/docs
- **FastAPI ReDoc**: http://localhost:8000/redoc

## Verification

### 1. Check All Services

```powershell
# Test each service
curl http://localhost:5011/health
curl http://localhost:8000/
curl http://localhost:5000/status
curl http://localhost:3000/
```

### 2. Verify Blueprint Loaded

```powershell
npm run verify:blueprint
```

Should show:
- ✅ Blueprint file loaded
- ✅ Dashboard is running
- ✅ Scenario fingerprints detected

### 3. Check Event Flow

```powershell
# Send test event via Flask
curl -X POST http://localhost:5000/run-agent `
  -H "Content-Type: application/json" `
  -d '{\"agent\":\"affidavit_bot\",\"payload\":{\"statement\":\"Test\"}}'

# Check events received in SintraPrime
curl http://localhost:5011/events?limit=5
```

### 4. Monitor Heartbeat

```powershell
# Check heartbeat file
Get-Content sintraprime-agent\logs\heartbeat.log

# Check mode
Get-Content sintraprime-agent\data\current_mode.json
```

## Troubleshooting

### Services Won't Start

1. **Check ports are not in use:**
   ```powershell
   netstat -ano | findstr ":5011"
   netstat -ano | findstr ":8000"
   netstat -ano | findstr ":5000"
   netstat -ano | findstr ":3000"
   ```

2. **Check Python/Node paths:**
   ```powershell
   where python
   where node
   ```

3. **Check Task Scheduler:**
   - Open Task Scheduler (`taskschd.msc`)
   - Look for IkeBot-* tasks
   - Check "Last Run Result" column

### Events Not Flowing

1. **Check SintraPrime Dashboard is running:**
   ```powershell
   curl http://localhost:5011/health
   ```

2. **Check event logs:**
   ```powershell
   Get-Content sintraprime-agent\logs\sintra-dashboard.log -Tail 20
   ```

3. **Check Flask connection:**
   ```powershell
   curl http://localhost:5000/mode
   ```

### Blueprint Not Loading

1. **Verify file exists:**
   ```powershell
   Test-Path src\config\templates\verizon_enforcement_v1.blueprint.json
   ```

2. **Check fingerprints endpoint:**
   ```powershell
   curl http://localhost:5011/fingerprints
   ```

## Development Mode

For development with auto-reload:

```powershell
# Terminal 1: SintraPrime Dashboard
cd sintraprime-agent
npm run dev

# Terminal 2: FastAPI (with uvicorn reload)
uvicorn api_server:app --reload --port 8000

# Terminal 3: Flask (debug mode enabled by default)
python main.py

# Terminal 4: Node.js Backend (ts-node-dev with hot reload)
npm run dev
```

## Production Deployment

### Using Scheduled Tasks

The registered tasks are configured for production:

- **Restart on failure**: Up to 3 times
- **Restart interval**: 1 minute
- **No execution time limit**: Services run continuously
- **Start when available**: Services start after unexpected shutdown

### Using Windows Service

For better reliability, consider wrapping in Windows Services:

```powershell
# Using NSSM (Non-Sucking Service Manager)
nssm install IkeBot-SintraDashboard "C:\Program Files\nodejs\node.exe" "sintraprime-agent\dashboard-server.js"
nssm set IkeBot-SintraDashboard AppDirectory "C:\path\to\ike-bot"
nssm start IkeBot-SintraDashboard
```

## Monitoring

### Log Files

```
sintraprime-agent/
├── logs/
│   ├── heartbeat.log          # Updated every 60s
│   └── sintra-dashboard.log   # Dashboard logs
└── memory/
    └── events_YYYY-MM-DD.jsonl  # Daily event logs
```

### Viewing Logs

```powershell
# Real-time dashboard logs
Get-Content sintraprime-agent\logs\sintra-dashboard.log -Wait -Tail 20

# View events for today
$date = Get-Date -Format "yyyy-MM-dd"
Get-Content "sintraprime-agent\memory\events_$date.jsonl" | ConvertFrom-Json
```

### Health Checks

Create a monitoring script:

```powershell
# health-check.ps1
$services = @(
    @{Name="SintraPrime"; URL="http://localhost:5011/health"},
    @{Name="FastAPI"; URL="http://localhost:8000/"},
    @{Name="Flask"; URL="http://localhost:5000/status"},
    @{Name="Node.js"; URL="http://localhost:3000/"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-RestMethod -Uri $service.URL -TimeoutSec 5
        Write-Host "✅ $($service.Name): OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($service.Name): DOWN" -ForegroundColor Red
    }
}
```

## Uninstalling

To remove all scheduled tasks:

```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like "IkeBot*"} | Unregister-ScheduledTask -Confirm:$false
```

## Support

For issues:
1. Check log files in `sintraprime-agent/logs/`
2. Verify Task Scheduler status
3. Test each service independently
4. Check firewall/antivirus settings

## Next Steps

After setup:
1. Configure real Make.com webhook
2. Set up Supabase database
3. Configure Stripe webhooks
4. Set up Notion integration
5. Configure email (Gmail) settings
