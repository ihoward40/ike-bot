# Register Windows Scheduled Tasks for IKE Bot and SintraPrime
# Run as Administrator: powershell -ExecutionPolicy Bypass -File scripts/register_tasks.ps1

Write-Host "🔧 IKE Bot - Windows Scheduled Tasks Registration" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Get the repository root directory
$repoRoot = Split-Path -Parent $PSScriptRoot
Write-Host "📁 Repository: $repoRoot" -ForegroundColor Green
Write-Host ""

# Configuration
$taskPrefix = "IkeBot"
$pythonExe = "C:\Python314\python.exe"
$nodeExe = "C:\Program Files\nodejs\node.exe"
$npmCmd = "C:\Program Files\nodejs\npm.cmd"

# Check if Python exists
if (-not (Test-Path $pythonExe)) {
    Write-Host "⚠️  Python not found at: $pythonExe" -ForegroundColor Yellow
    $pythonExe = Read-Host "Enter full path to python.exe"
}

# Check if Node.js exists
if (-not (Test-Path $nodeExe)) {
    Write-Host "⚠️  Node.js not found at: $nodeExe" -ForegroundColor Yellow
    $nodeExe = Read-Host "Enter full path to node.exe"
}

Write-Host "✅ Python: $pythonExe" -ForegroundColor Green
Write-Host "✅ Node.js: $nodeExe" -ForegroundColor Green
Write-Host ""

# Task 1: SintraPrime Dashboard (runs continuously)
Write-Host "📝 Creating Task 1: SintraPrime Dashboard" -ForegroundColor Cyan

$task1Name = "$taskPrefix-SintraDashboard"
$task1Action = New-ScheduledTaskAction -Execute $nodeExe `
    -Argument "$repoRoot\sintraprime-agent\dashboard-server.js" `
    -WorkingDirectory "$repoRoot\sintraprime-agent"

$task1Trigger = New-ScheduledTaskTrigger -AtStartup

$task1Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)  # No time limit

try {
    # Remove existing task if it exists
    Unregister-ScheduledTask -TaskName $task1Name -Confirm:$false -ErrorAction SilentlyContinue
    
    # Register new task
    Register-ScheduledTask -TaskName $task1Name `
        -Action $task1Action `
        -Trigger $task1Trigger `
        -Settings $task1Settings `
        -Description "SintraPrime Dashboard - Event and mode management server" `
        -User $env:USERNAME `
        -RunLevel Highest
    
    Write-Host "✅ Created: $task1Name" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create $task1Name : $_" -ForegroundColor Red
}

# Task 2: FastAPI Server (runs continuously)
Write-Host "📝 Creating Task 2: FastAPI Server" -ForegroundColor Cyan

$task2Name = "$taskPrefix-FastAPI"
$task2Action = New-ScheduledTaskAction -Execute $pythonExe `
    -Argument "$repoRoot\api_server.py" `
    -WorkingDirectory $repoRoot

$task2Trigger = New-ScheduledTaskTrigger -AtStartup

$task2Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)

try {
    Unregister-ScheduledTask -TaskName $task2Name -Confirm:$false -ErrorAction SilentlyContinue
    
    Register-ScheduledTask -TaskName $task2Name `
        -Action $task2Action `
        -Trigger $task2Trigger `
        -Settings $task2Settings `
        -Description "IKE Bot FastAPI Server - Async API with SintraPrime integration" `
        -User $env:USERNAME `
        -RunLevel Highest
    
    Write-Host "✅ Created: $task2Name" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create $task2Name : $_" -ForegroundColor Red
}

# Task 3: Flask Server (runs continuously)
Write-Host "📝 Creating Task 3: Flask Server" -ForegroundColor Cyan

$task3Name = "$taskPrefix-Flask"
$task3Action = New-ScheduledTaskAction -Execute $pythonExe `
    -Argument "$repoRoot\main.py" `
    -WorkingDirectory $repoRoot

$task3Trigger = New-ScheduledTaskTrigger -AtStartup

$task3Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)

try {
    Unregister-ScheduledTask -TaskName $task3Name -Confirm:$false -ErrorAction SilentlyContinue
    
    Register-ScheduledTask -TaskName $task3Name `
        -Action $task3Action `
        -Trigger $task3Trigger `
        -Settings $task3Settings `
        -Description "IKE Bot Flask Server - PDF generation and legacy endpoints" `
        -User $env:USERNAME `
        -RunLevel Highest
    
    Write-Host "✅ Created: $task3Name" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create $task3Name : $_" -ForegroundColor Red
}

# Task 4: Node.js Backend (TypeScript)
Write-Host "📝 Creating Task 4: Node.js Backend" -ForegroundColor Cyan

$task4Name = "$taskPrefix-NodeBackend"
$task4Action = New-ScheduledTaskAction -Execute $npmCmd `
    -Argument "run start" `
    -WorkingDirectory $repoRoot

$task4Trigger = New-ScheduledTaskTrigger -AtStartup

$task4Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)

try {
    Unregister-ScheduledTask -TaskName $task4Name -Confirm:$false -ErrorAction SilentlyContinue
    
    Register-ScheduledTask -TaskName $task4Name `
        -Action $task4Action `
        -Trigger $task4Trigger `
        -Settings $task4Settings `
        -Description "IKE Bot Node.js Backend - CRUD APIs and webhooks" `
        -User $env:USERNAME `
        -RunLevel Highest
    
    Write-Host "✅ Created: $task4Name" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create $task4Name : $_" -ForegroundColor Red
}

# Task 5: Heartbeat Monitor (runs every minute)
Write-Host "📝 Creating Task 5: Heartbeat Monitor" -ForegroundColor Cyan

$task5Name = "$taskPrefix-Heartbeat"
$task5Action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"Invoke-RestMethod -Uri 'http://localhost:5011/heartbeat' -Method Get`"" `
    -WorkingDirectory $repoRoot

$task5Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 1)

$task5Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Seconds 30)

try {
    Unregister-ScheduledTask -TaskName $task5Name -Confirm:$false -ErrorAction SilentlyContinue
    
    Register-ScheduledTask -TaskName $task5Name `
        -Action $task5Action `
        -Trigger $task5Trigger `
        -Settings $task5Settings `
        -Description "SintraPrime Heartbeat Monitor - Pings dashboard every minute" `
        -User $env:USERNAME
    
    Write-Host "✅ Created: $task5Name" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create $task5Name : $_" -ForegroundColor Red
}

# Task 6: Daily Digest (runs daily at 8 AM)
Write-Host "📝 Creating Task 6: Daily Digest" -ForegroundColor Cyan

$task6Name = "$taskPrefix-DailyDigest"
$task6Action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"Invoke-RestMethod -Uri 'http://localhost:5000/digest' -Method Post -ContentType 'application/json' -Body '{}'`"" `
    -WorkingDirectory $repoRoot

$task6Trigger = New-ScheduledTaskTrigger -Daily -At 8am

$task6Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

try {
    Unregister-ScheduledTask -TaskName $task6Name -Confirm:$false -ErrorAction SilentlyContinue
    
    Register-ScheduledTask -TaskName $task6Name `
        -Action $task6Action `
        -Trigger $task6Trigger `
        -Settings $task6Settings `
        -Description "IKE Bot Daily Digest - Sends daily filing summary" `
        -User $env:USERNAME
    
    Write-Host "✅ Created: $task6Name" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create $task6Name : $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✨ Task Registration Complete!" -ForegroundColor Green
Write-Host ""

# List created tasks
Write-Host "📋 Registered Tasks:" -ForegroundColor Cyan
Get-ScheduledTask | Where-Object {$_.TaskName -like "$taskPrefix*"} | Select-Object TaskName, State, LastRunTime | Format-Table -AutoSize

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review tasks in Task Scheduler (taskschd.msc)" -ForegroundColor White
Write-Host "2. Start tasks manually or reboot to trigger AtStartup tasks" -ForegroundColor White
Write-Host "3. Check logs in sintraprime-agent/logs/" -ForegroundColor White
Write-Host "4. Verify services are running:" -ForegroundColor White
Write-Host "   - SintraPrime: http://localhost:5011" -ForegroundColor White
Write-Host "   - FastAPI: http://localhost:8000" -ForegroundColor White
Write-Host "   - Flask: http://localhost:5000" -ForegroundColor White
Write-Host "   - Node.js: http://localhost:3000" -ForegroundColor White
Write-Host ""

# Option to start tasks now
$startNow = Read-Host "Start all tasks now? (y/n)"
if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Starting all tasks..." -ForegroundColor Cyan
    
    Start-ScheduledTask -TaskName "$taskPrefix-SintraDashboard"
    Start-Sleep -Seconds 3
    Start-ScheduledTask -TaskName "$taskPrefix-FastAPI"
    Start-Sleep -Seconds 2
    Start-ScheduledTask -TaskName "$taskPrefix-Flask"
    Start-Sleep -Seconds 2
    Start-ScheduledTask -TaskName "$taskPrefix-NodeBackend"
    Start-Sleep -Seconds 2
    Start-ScheduledTask -TaskName "$taskPrefix-Heartbeat"
    
    Write-Host "✅ All tasks started! Check Task Scheduler for status." -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! ✨" -ForegroundColor Green
