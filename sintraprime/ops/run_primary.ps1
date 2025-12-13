# SintraPrime Primary Node Launcher
# Run as Windows Service-like "always on" system
# Schedule with: schtasks /Create /F /SC ONSTART /RL HIGHEST /TN "SintraPrimePrimary" /TR "powershell -ExecutionPolicy Bypass -File C:\SintraPrime\ops\run_primary.ps1"

$ErrorActionPreference = "Stop"
Set-Location C:\SintraPrime

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SintraPrime Primary Node - Starting...   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Start Primary API (voice + events + job ledger)
Write-Host "[Primary] Starting FastAPI server on port 7777..." -ForegroundColor Green
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
    "-NoProfile",
    "-Command",
    "cd C:\SintraPrime; python -m uvicorn sintraprime.core.api:app --host 0.0.0.0 --port 7777 --log-level info"
)

# Wait for API to be ready
Write-Host "[Primary] Waiting for API to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:7777/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "[Primary] ✅ API is online: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[Primary] ⚠️  API not responding yet, continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[Primary] Starting Timeline Enforcement Loop (15min interval)..." -ForegroundColor Green
Write-Host ""

# Timeline enforcement loop (24/48/72 escalations)
# This loop NEVER dies - it's the heartbeat of enforcement
$iteration = 0
while ($true) {
    $iteration++
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    try {
        Write-Host "[$timestamp] Timeline tick #$iteration - Checking escalations..." -ForegroundColor Cyan
        
        python -c "from sintraprime.core.timeline_engine import tick; result = tick(); print(f'Escalations fired: {result}')"
        
        Write-Host "[$timestamp] ✅ Timeline tick completed" -ForegroundColor Green
        
    } catch {
        Write-Host "[$timestamp] ❌ Timeline engine error: $_" -ForegroundColor Red
        
        # Never die silently - announce failure
        try {
            python -c "from sintraprime.voice.conductor import start, say; start(); say('SENTINEL', 'Timeline engine error detected. Restarting loop.')"
        } catch {
            Write-Host "[$timestamp] ⚠️  Could not announce error via voice" -ForegroundColor Yellow
        }
    }
    
    # Sleep 15 minutes (900 seconds)
    Write-Host "[$timestamp] Sleeping 15 minutes until next check..." -ForegroundColor Gray
    Write-Host ""
    Start-Sleep -Seconds 900
}
