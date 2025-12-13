# SintraPrime Production Dominance Test
# One-button end-to-end test of the complete system

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SintraPrime Production Dominance Test     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Set-Location C:\SintraPrime

# Step 1: Create fake case with 73-hour-old notice
Write-Host "Step 1: Creating test case with 73-hour-old notice..." -ForegroundColor Yellow
python -c @"
from datetime import datetime, timedelta
from sintraprime.core.db import connect

conn = connect()
case_id = 'CASE-DOMINANCE-001'
notice_sent = (datetime.now() - timedelta(hours=73)).isoformat()

conn.execute(
    'INSERT INTO timelines(case_id, event, timestamp) VALUES(?, ?, ?)',
    (case_id, 'NOTICE_SENT', notice_sent)
)
conn.commit()
conn.close()

print(f'✅ Inserted NOTICE_SENT 73h ago for {case_id}')
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create test case" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Run timeline tick
Write-Host "Step 2: Running timeline escalation check..." -ForegroundColor Yellow
python -c "from sintraprime.core.timeline_engine import tick; result = tick(); print(f'Escalations fired: {result}')"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Timeline tick failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Check jobs created
Write-Host "Step 3: Checking CERTIFIED_MAIL_DISPATCH jobs created..." -ForegroundColor Yellow
$jobCount = python -c @"
from sintraprime.core.event_bus import get_pending_jobs
jobs = get_pending_jobs('CERTIFIED_MAIL_DISPATCH')
print(len(jobs))
for job in jobs:
    print(f'  Job #{job[\"id\"]}: {job[\"event_type\"]} (P{job[\"priority\"]})')
"@

if ($jobCount -gt 0) {
    Write-Host "✅ Found $jobCount CERTIFIED_MAIL_DISPATCH job(s)" -ForegroundColor Green
} else {
    Write-Host "❌ No CERTIFIED_MAIL_DISPATCH jobs found" -ForegroundColor Red
}

Write-Host ""

# Step 4: Check Primary API
Write-Host "Step 4: Checking Primary API health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:7777/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Primary API is online" -ForegroundColor Green
} catch {
    Write-Host "❌ Primary API is not responding" -ForegroundColor Red
    Write-Host "Start it with: python -m uvicorn sintraprime.core.api:app --host 0.0.0.0 --port 7777" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Check stats
Write-Host "Step 5: System statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://127.0.0.1:7777/stats" -Method Get -TimeoutSec 5
    Write-Host "  Pending jobs: $($stats.jobs.pending)" -ForegroundColor White
    Write-Host "  Completed jobs: $($stats.jobs.completed)" -ForegroundColor White
    Write-Host "  Failed jobs: $($stats.jobs.failed)" -ForegroundColor White
    Write-Host "  Active cases: $($stats.active_cases)" -ForegroundColor White
} catch {
    Write-Host "⚠️  Could not fetch stats" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       Expected System Behavior              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "If Primary API + Workers are running, you should see:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Timeline emits CERTIFIED_MAIL_DISPATCH job (P1)" -ForegroundColor White
Write-Host "2. Vault Guardian: 'Seventy-two hours elapsed. Escalation initiated.'" -ForegroundColor Yellow
Write-Host "3. Cert mail worker claims job" -ForegroundColor White
Write-Host "4. Worker submits certified mail" -ForegroundColor White
Write-Host "5. Worker reports completion to Primary" -ForegroundColor White
Write-Host "6. Vault Guardian: 'Certified mail submitted for case DOMINANCE-001...'" -ForegroundColor Yellow
Write-Host ""

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  THIS IS INSTITUTIONAL BEHAVIOR             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "To start the full system:" -ForegroundColor Yellow
Write-Host "1. Primary: powershell -ExecutionPolicy Bypass -File C:\SintraPrime\ops\run_primary.ps1" -ForegroundColor White
Write-Host "2. Workers: powershell -ExecutionPolicy Bypass -File C:\SintraPrime\ops\run_worker.ps1" -ForegroundColor White
Write-Host ""
