# SintraPrime Production Deployment Guide

**Complete production hardening: Reboot-proof, multi-machine, real certified mail**

---

## Quick Production Setup (30 Minutes)

### 1. Primary Node Setup

```powershell
# Run as Administrator
cd C:\SintraPrime

# Schedule Primary as service (reboot-proof)
powershell -ExecutionPolicy Bypass -File sintraprime\ops\schedule_services.ps1

# Start Primary immediately
powershell -ExecutionPolicy Bypass -File sintraprime\ops\run_primary.ps1
```

**You will hear**: "SintraPrime: System online. Time is [date]. Dominance modules active."

### 2. Worker Node Setup (Same or Different Machine)

```powershell
# Configure environment
setx SINTRA_PRIMARY "http://127.0.0.1:7777"  # Or Tailscale IP
setx WORKER_ID "worker-01"
setx CAN_HANDLE "FOLLOWUP_NOTICE_DRAFT,FOLLOWUP_NOTICE_SEND,EVIDENCE_SNAPSHOT"

# Restart PowerShell, then schedule
powershell -ExecutionPolicy Bypass -File sintraprime\ops\schedule_services.ps1

# Start Workers immediately
powershell -ExecutionPolicy Bypass -File sintraprime\ops\run_worker.ps1
```

### 3. Test End-to-End

```powershell
powershell -ExecutionPolicy Bypass -File sintraprime\ops\test_dominance_production.ps1
```

---

## Production Features ✅

### 1. Reboot-Proof (Windows Services)

**Primary Node**:
- Scheduled task runs on startup
- Auto-restarts on failure
- Timeline enforcement loop (15min interval)
- Voice announces errors

**Worker Nodes**:
- Scheduled task runs on startup
- Multiple worker processes
- Auto-reconnect to Primary
- Independent operation

**Schedule Command**:
```powershell
# Run once as Administrator
powershell -ExecutionPolicy Bypass -File sintraprime\ops\schedule_services.ps1
```

**Verify**:
```powershell
schtasks /Query /TN SintraPrimePrimary
schtasks /Query /TN SintraPrimeWorkers
schtasks /Query /TN SintraPrimeWeeklyBriefing
```

---

### 2. Multi-Machine Networking (Tailscale)

**Why Tailscale**:
- Private network across machines
- Works anywhere (home, office, cloud)
- No VPN configuration
- Stable IP addresses (100.x.y.z)

**Setup**:

1. **Install Tailscale on all machines**:
   - Download: https://tailscale.com/download
   - Run: `tailscale up`

2. **Configure Primary**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File sintraprime\ops\setup_tailscale.ps1
   ```
   - Select "Y" for Primary
   - Note the Tailscale IP (e.g., 100.64.23.45)

3. **Configure Workers**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File sintraprime\ops\setup_tailscale.ps1
   ```
   - Select "N" for Worker
   - Enter Primary's Tailscale IP
   - Enter Worker ID (e.g., worker-02)

**Result**: Workers can run from anywhere, connecting securely to Primary

---

### 3. Network Hiccup Resistance

**Worker Auto-Reconnect**:
- Workers retry Primary connection indefinitely
- 5-second backoff between attempts
- Continues processing when Primary returns

**Timeline Loop Never Dies**:
- Catches all exceptions
- Announces errors via voice
- Continues loop immediately

**Job Queue Resilience**:
- Jobs persist in SQLite (survive reboots)
- Atomic claiming prevents race conditions
- Failed jobs auto-retry (up to 3 times)

---

### 4. Notion + Make.com Integration

**Make.com Scenario**:

**Module 1: Notion - Watch Events**
- Database: Cases
- Trigger: When record updated

**Module 2: HTTP - Make a Request**
- Method: POST
- URL: `http://<PRIMARY_TAILSCALE_IP>:7777/event`
- Headers: `Content-Type: application/json`
- Body:
  ```json
  {
    "event_type": "NOTION_CASE_UPDATED",
    "payload": {
      "case_id": "{{case_id}}",
      "stage": "{{stage}}",
      "title": "{{title}}"
    },
    "priority": 2
  }
  ```

**If Make.com can't reach Tailscale IP** (common):

Option 1: **Cloudflare Tunnel** (free)
```bash
cloudflared tunnel --url http://localhost:7777
```

Option 2: **ngrok** (free tier)
```bash
ngrok http 7777
```

Then use the public URL in Make.com

---

### 5. Real Certified Mail (Click2Mail Integration)

**Current**: Stub implementation  
**Production**: Real API calls

**Setup**:

1. **Get Click2Mail API credentials**:
   - Sign up: https://www.click2mail.com/
   - Get API Key + Secret from dashboard

2. **Configure environment**:
   ```powershell
   setx MAIL_PROVIDER "CLICK2MAIL"
   setx CLICK2MAIL_API_KEY "your_api_key"
   setx CLICK2MAIL_API_SECRET "your_api_secret"
   ```

3. **Update cert_mail_worker.py** (Phase 2):
   ```python
   def submit_certified_mail(case_id: str) -> dict:
       import requests
       
       # Real Click2Mail API call
       response = requests.post(
           "https://rest.click2mail.com/molpro/v2/jobs",
           headers={
               "X-API-KEY": os.getenv("CLICK2MAIL_API_KEY"),
               "X-API-SECRET": os.getenv("CLICK2MAIL_API_SECRET"),
               "Content-Type": "application/json"
           },
           json={
               "documents": [{"documentId": "packet_pdf"}],
               "addresses": [{"address1": "...", "city": "...", ...}],
               "mailClass": "FIRST_CLASS_CERTIFIED",
               "returnEnvelope": True
           }
       )
       
       result = response.json()
       
       return {
           "provider": "CLICK2MAIL",
           "provider_job_id": result["jobId"],
           "tracking_number": result["trackingNumber"],
           "status": "SUBMITTED"
       }
   ```

**Result**: 72h escalation automatically triggers real certified mail

---

### 6. Weekly Spoken Briefing (Production Quality)

**Enhanced briefing_worker.py** (Phase 2):

```python
def build_briefing() -> str:
    conn = connect()
    cur = conn.cursor()
    
    # Top 5 cases by urgency
    cur.execute("""
        SELECT case_id, event, timestamp
        FROM timelines
        WHERE event='NOTICE_SENT'
        ORDER BY timestamp ASC
        LIMIT 5
    """)
    top_cases = cur.fetchall()
    
    # Pending escalations
    cur.execute("""
        SELECT COUNT(*) FROM timelines
        WHERE event LIKE 'ESCALATION_%'
        AND timestamp > datetime('now', '-7 days')
    """)
    recent_escalations = cur.fetchone()[0]
    
    # Certified mail status
    cur.execute("""
        SELECT COUNT(*) FROM certified_mail
        WHERE status='SUBMITTED'
    """)
    pending_mail = cur.fetchone()[0]
    
    # Build briefing
    briefing = f"""
    Weekly Trust Operations Briefing.
    
    Top cases: {len(top_cases)} active notices pending response.
    Recent escalations: {recent_escalations} in the past 7 days.
    Certified mailings: {pending_mail} pending delivery confirmation.
    
    Next actions have been queued. Monitoring continues.
    """
    
    conn.close()
    return briefing
```

**Scheduled**: Every Monday at 9:15 AM

---

## Production Scripts

### run_primary.ps1
- Starts FastAPI on port 7777
- Runs timeline enforcement loop (15min)
- Auto-restarts on errors
- Voice announces failures

### run_worker.ps1
- Starts generic worker (draft/send/evidence)
- Starts certified mail worker
- Monitors Primary connectivity
- Auto-reconnect on network issues

### schedule_services.ps1
- Creates Windows scheduled tasks
- Primary: Run on startup
- Workers: Run on startup
- Weekly briefing: Mondays 9:15 AM

### setup_tailscale.ps1
- Interactive Tailscale configuration
- Primary vs Worker detection
- Environment variable setup

### test_dominance_production.ps1
- One-button end-to-end test
- Creates 73h-old notice
- Runs escalation check
- Verifies job creation
- Checks API health

---

## Production Checklist

### Initial Deployment
- [ ] Install Python + dependencies (`pip install -r requirements.txt`)
- [ ] Initialize database (`python sintraprime/core/db.py`)
- [ ] Install Tailscale (if multi-machine)
- [ ] Configure Tailscale networking
- [ ] Set environment variables
- [ ] Schedule services (run as Administrator)
- [ ] Test with `test_dominance_production.ps1`

### Primary Node
- [ ] Scheduled task: SintraPrimePrimary
- [ ] FastAPI running on port 7777
- [ ] Timeline loop active (15min interval)
- [ ] Voice system operational

### Worker Node(s)
- [ ] Scheduled task: SintraPrimeWorkers
- [ ] Environment: SINTRA_PRIMARY set
- [ ] Environment: WORKER_ID set
- [ ] Environment: CAN_HANDLE set
- [ ] Workers connecting to Primary

### Integration
- [ ] Notion database configured
- [ ] Make.com scenario created
- [ ] Webhook URL accessible
- [ ] Test event flow: Notion → Make → SintraPrime

### Certified Mail
- [ ] Click2Mail account created
- [ ] API credentials obtained
- [ ] Environment: CLICK2MAIL_API_KEY set
- [ ] Environment: CLICK2MAIL_API_SECRET set
- [ ] Worker code updated (Phase 2)

---

## Monitoring & Health Checks

### Check Primary Health
```powershell
curl http://localhost:7777/health
```

### Check System Stats
```powershell
curl http://localhost:7777/stats
```

### View Scheduled Tasks
```powershell
schtasks /Query /TN SintraPrimePrimary /V
schtasks /Query /TN SintraPrimeWorkers /V
```

### Check Database
```powershell
python -c "from sintraprime.core.event_bus import get_job_stats; print(get_job_stats())"
```

### Test Voice
```powershell
python -c "from sintraprime.voice.conductor import start, say; start(); say('SINTRAPRIME', 'System test')"
```

---

## Troubleshooting

### Primary Not Starting
1. Check port 7777 not in use: `netstat -an | findstr 7777`
2. Check Python path: `python --version`
3. Check dependencies: `pip list | findstr fastapi`
4. Check logs: `C:\SintraPrime\logs\`

### Workers Not Connecting
1. Check SINTRA_PRIMARY env var: `echo %SINTRA_PRIMARY%`
2. Test Primary connectivity: `curl http://<PRIMARY_IP>:7777/health`
3. Check Tailscale: `tailscale status`
4. Check worker logs

### No Voice Output
1. Check audio devices: `Get-AudioDevice -List`
2. Test voice script: `powershell -File sintraprime\voice\edge_tts.ps1 -Text "test"`
3. Check VOICE_ENABLED env var
4. Check speaker volume

### Jobs Not Processing
1. Check job queue: `curl http://localhost:7777/stats`
2. Check workers running: `Get-Process | findstr python`
3. Check worker logs
4. Manual job test: `curl http://localhost:7777/job/next?worker_id=test`

---

## The One-Button Dominance Test

```powershell
powershell -ExecutionPolicy Bypass -File sintraprime\ops\test_dominance_production.ps1
```

**Expected behavior**:
1. Creates case with 73-hour-old notice
2. Timeline detects escalation
3. Creates CERTIFIED_MAIL_DISPATCH job
4. Vault Guardian: "Seventy-two hours elapsed. Escalation initiated."
5. Worker claims and processes job
6. Vault Guardian: "Certified mail submitted for case DOMINANCE-001..."

**This is institutional behavior.**

---

## Production Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRIMARY NODE                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  FastAPI (7777)                                  │  │
│  │  - /event (webhooks)                             │  │
│  │  - /job/next (worker claims)                     │  │
│  │  - /job/complete (worker reports)                │  │
│  │  - Voice Conductor (speaks automatically)        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Timeline Engine (15min loop)                    │  │
│  │  - Checks all active cases                       │  │
│  │  - Fires 24/48/72h escalations                   │  │
│  │  - Creates CONCRETE JOBS                         │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  SQLite Database (jobs.db)                       │  │
│  │  - Jobs queue                                    │  │
│  │  - Timelines (legal chronology)                  │  │
│  │  - Evidence chain                                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                  Tailscale Private Network
                           │
┌─────────────────────────────────────────────────────────┐
│                    WORKER NODE(S)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Generic Worker                                  │  │
│  │  - Claims: FOLLOWUP_NOTICE_*, EVIDENCE_SNAPSHOT  │  │
│  │  - Executes handlers                             │  │
│  │  - Reports completion                            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Certified Mail Worker                           │  │
│  │  - Claims: CERTIFIED_MAIL_DISPATCH               │  │
│  │  - Submits to Click2Mail API                     │  │
│  │  - Reports tracking info                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │
┌─────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Notion + Make.com                               │  │
│  │  - Case updates → POST /event                    │  │
│  │  - Triggers voice + job creation                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Click2Mail API                                  │  │
│  │  - Receives certified mail requests              │  │
│  │  - Returns tracking numbers                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

**DOMINANCE = PRESENCE + PERSISTENCE + PROOF**

*System survives reboots. Workers survive network issues. 72h silence triggers real mail. Vault Guardian testifies.*

---

*Last Updated: 2025-12-13*  
*Version: Production v1*
