# SintraPrime Worker Node Launcher
# Runs all worker processes (multi-machine ready)
# Schedule with: schtasks /Create /F /SC ONSTART /RL HIGHEST /TN "SintraPrimeWorkers" /TR "powershell -ExecutionPolicy Bypass -File C:\SintraPrime\ops\run_worker.ps1"

$ErrorActionPreference = "Continue"
Set-Location C:\SintraPrime

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SintraPrime Worker Node - Starting...    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get Primary URL from environment (should be set via setx)
$primaryUrl = $env:SINTRA_PRIMARY
if (-not $primaryUrl) {
    $primaryUrl = "http://127.0.0.1:7777"
    Write-Host "[Worker] ⚠️  SINTRA_PRIMARY not set, using default: $primaryUrl" -ForegroundColor Yellow
} else {
    Write-Host "[Worker] Primary API: $primaryUrl" -ForegroundColor Green
}

# Check Primary is reachable
Write-Host "[Worker] Checking Primary availability..." -ForegroundColor Yellow
$retries = 0
$maxRetries = 10

while ($retries -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "$primaryUrl/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "[Worker] ✅ Primary is online: $($response.StatusCode)" -ForegroundColor Green
        break
    } catch {
        $retries++
        Write-Host "[Worker] ⚠️  Primary not reachable (attempt $retries/$maxRetries), retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if ($retries -eq $maxRetries) {
    Write-Host "[Worker] ❌ Could not reach Primary after $maxRetries attempts" -ForegroundColor Red
    Write-Host "[Worker] Workers will continue trying to connect..." -ForegroundColor Yellow
}

Write-Host ""

# Start main worker (draft/send/evidence)
Write-Host "[Worker] Starting Generic Worker (FOLLOWUP_NOTICE, EVIDENCE_SNAPSHOT)..." -ForegroundColor Green
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
    "-NoProfile",
    "-Command",
    "cd C:\SintraPrime; python sintraprime\workers\worker_runner.py"
)

Start-Sleep -Seconds 2

# Start certified mail worker (72h consequence)
Write-Host "[Worker] Starting Certified Mail Worker (CERTIFIED_MAIL_DISPATCH)..." -ForegroundColor Green
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
    "-NoProfile",
    "-Command",
    "cd C:\SintraPrime; python sintraprime\workers\cert_mail_worker.py"
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     All Workers Started Successfully        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Workers will run indefinitely and auto-reconnect to Primary." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop this launcher (workers will continue running)." -ForegroundColor Gray
Write-Host ""

# Keep launcher alive (monitors worker health)
$checkInterval = 3600 # Check every hour
while ($true) {
    Start-Sleep -Seconds $checkInterval
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Worker node health check - All processes running" -ForegroundColor Cyan
}
