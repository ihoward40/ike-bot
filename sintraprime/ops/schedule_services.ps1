# SintraPrime Service Scheduler
# Run as Administrator to schedule Primary and Worker services
# This makes SintraPrime reboot-proof

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SintraPrime Service Scheduler - Setup     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Schedule Primary Node (runs on startup)
Write-Host "Scheduling Primary Node..." -ForegroundColor Yellow
schtasks /Create /F /SC ONSTART /RL HIGHEST /TN "SintraPrimePrimary" `
    /TR "powershell -ExecutionPolicy Bypass -File C:\SintraPrime\ops\run_primary.ps1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Primary Node scheduled successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to schedule Primary Node" -ForegroundColor Red
}

Write-Host ""

# Schedule Worker Node (runs on startup)
Write-Host "Scheduling Worker Node..." -ForegroundColor Yellow
schtasks /Create /F /SC ONSTART /RL HIGHEST /TN "SintraPrimeWorkers" `
    /TR "powershell -ExecutionPolicy Bypass -File C:\SintraPrime\ops\run_worker.ps1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Worker Node scheduled successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to schedule Worker Node" -ForegroundColor Red
}

Write-Host ""

# Schedule Weekly Briefing (every Monday at 9:15 AM)
Write-Host "Scheduling Weekly Briefing..." -ForegroundColor Yellow
schtasks /Create /F /SC WEEKLY /D MON /ST 09:15 /RL HIGHEST /TN "SintraPrimeWeeklyBriefing" `
    /TR "python C:\SintraPrime\sintraprime\workers\briefing_worker.py"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Weekly Briefing scheduled successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to schedule Weekly Briefing" -ForegroundColor Red
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     Scheduling Complete - Reboot Proof!     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Scheduled Tasks:" -ForegroundColor Cyan
Write-Host "- SintraPrimePrimary: Runs on startup" -ForegroundColor White
Write-Host "- SintraPrimeWorkers: Runs on startup" -ForegroundColor White
Write-Host "- SintraPrimeWeeklyBriefing: Runs every Monday at 9:15 AM" -ForegroundColor White
Write-Host ""

Write-Host "To verify, run: schtasks /Query /TN SintraPrimePrimary" -ForegroundColor Gray
Write-Host ""
Write-Host "System will survive reboots and announce itself via voice." -ForegroundColor Cyan
