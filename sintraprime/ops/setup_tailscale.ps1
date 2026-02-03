# SintraPrime Tailscale Setup
# Configures multi-machine networking for Worker → Primary communication

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SintraPrime Tailscale Network Setup       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Tailscale is installed
try {
    $tailscaleStatus = tailscale status 2>&1
    Write-Host "✅ Tailscale is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Tailscale is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Tailscale from: https://tailscale.com/download" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Get current Tailscale IP
Write-Host "Getting Tailscale IP address..." -ForegroundColor Yellow
$tailscaleIp = (tailscale ip -4) 2>&1

if ($LASTEXITCODE -eq 0 -and $tailscaleIp -match '100\.\d+\.\d+\.\d+') {
    Write-Host "✅ Tailscale IP: $tailscaleIp" -ForegroundColor Green
    Write-Host ""
    
    # Detect if this is Primary or Worker
    Write-Host "Is this machine the PRIMARY node? (Y/N)" -ForegroundColor Cyan
    $isPrimary = Read-Host
    
    if ($isPrimary -eq 'Y' -or $isPrimary -eq 'y') {
        Write-Host ""
        Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║        PRIMARY NODE CONFIGURATION           ║" -ForegroundColor Green
        Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your Primary Tailscale IP: $tailscaleIp" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "On each WORKER machine, run:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "setx SINTRA_PRIMARY `"http://$tailscaleIp:7777`"" -ForegroundColor White
        Write-Host "setx WORKER_ID `"worker-02`"" -ForegroundColor White
        Write-Host "setx CAN_HANDLE `"FOLLOWUP_NOTICE_DRAFT,FOLLOWUP_NOTICE_SEND,EVIDENCE_SNAPSHOT`"" -ForegroundColor White
        Write-Host ""
        Write-Host "Then schedule the worker:" -ForegroundColor Yellow
        Write-Host "powershell -ExecutionPolicy Bypass -File C:\SintraPrime\ops\schedule_services.ps1" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║        WORKER NODE CONFIGURATION            ║" -ForegroundColor Green
        Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "Enter the PRIMARY node's Tailscale IP (100.x.y.z):" -ForegroundColor Cyan
        $primaryIp = Read-Host
        
        Write-Host ""
        Write-Host "Enter this worker's ID (e.g., worker-02):" -ForegroundColor Cyan
        $workerId = Read-Host
        
        Write-Host ""
        Write-Host "Configuring worker environment..." -ForegroundColor Yellow
        
        # Set environment variables
        [System.Environment]::SetEnvironmentVariable("SINTRA_PRIMARY", "http://$primaryIp:7777", "User")
        [System.Environment]::SetEnvironmentVariable("WORKER_ID", $workerId, "User")
        [System.Environment]::SetEnvironmentVariable("CAN_HANDLE", "FOLLOWUP_NOTICE_DRAFT,FOLLOWUP_NOTICE_SEND,EVIDENCE_SNAPSHOT", "User")
        
        Write-Host "✅ Environment variables set:" -ForegroundColor Green
        Write-Host "   SINTRA_PRIMARY = http://$primaryIp:7777" -ForegroundColor White
        Write-Host "   WORKER_ID = $workerId" -ForegroundColor White
        Write-Host "   CAN_HANDLE = FOLLOWUP_NOTICE_DRAFT,FOLLOWUP_NOTICE_SEND,EVIDENCE_SNAPSHOT" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  You must restart PowerShell or reboot for changes to take effect" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Then schedule the worker:" -ForegroundColor Yellow
        Write-Host "powershell -ExecutionPolicy Bypass -File C:\SintraPrime\ops\schedule_services.ps1" -ForegroundColor White
        Write-Host ""
    }
    
} else {
    Write-Host "❌ Could not get Tailscale IP" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure Tailscale is connected:" -ForegroundColor Yellow
    Write-Host "tailscale up" -ForegroundColor White
    Write-Host ""
}

Write-Host "Multi-machine networking configured!" -ForegroundColor Cyan
Write-Host "Workers can now operate from anywhere like they're on the same LAN." -ForegroundColor Cyan
