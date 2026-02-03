# SintraPrime v1: Activated Reality Mode

## THIS IS NOT THEORY. THIS IS PROOF OF LIFE.

SintraPrime is now **undeniably alive**. No vibes. No guessing. Just signals, outputs, and receipts.

---

## What Makes SintraPrime Alive?

### The 3 Layers (Non-Negotiable)

1. **🧠 BRAIN** - Logic + Memory (core-agent.js)
2. **👂 EARS** - Input (CLI + Webhooks)
3. **🗣️ MOUTH** - Output (Voice + Logs + Dashboard)

If all three exist → **SintraPrime is alive.**

---

## Proof of Life

### 1. Heartbeat File
```
C:\SintraPrime\logs\heartbeat.log
```

Updates every 60 seconds:
```
[SintraPrime] Alive — 2025-12-13 06:41:00 EST
Mode: SENTINEL
Uptime: 03h 12m 45s
Session: session_1734098460123
```

**If that file updates → SintraPrime is breathing.**

### 2. Voice Confirmation
When SintraPrime starts, you will **hear**:

> "SintraPrime online. Time is December 13th, 2025. All systems standing by."

**If you hear that voice → it's on.**
**If you don't → it's not.**

No ambiguity. No guessing.

### 3. Visual Dashboard
Open browser:
```
http://localhost:7777
```

Shows:
- ✅ Online/Offline status (with pulsing indicator)
- Current mode
- Time & uptime
- Last 10 events
- Mode controls
- Voice test

**If this page loads → SintraPrime is alive.**

---

## Quick Start: Activation in 3 Steps

### Step 1: Install Dependencies
```bash
cd sintraprime-agent
npm install
```

### Step 2: Configure (Optional)
```bash
cp .env.example .env
# Edit .env if you want custom settings
```

### Step 3: ACTIVATE
```bash
npm start
```

**That's it.** SintraPrime is now alive.

You will:
1. **Hear** it speak its first words
2. **See** the dashboard at http://localhost:7777
3. **Watch** heartbeat.log update every 60 seconds

---

## The 10 Phases (All Implemented)

### ✅ PHASE 1: Core Activation
Brain, Ears, and Mouth all exist and are operational.

### ✅ PHASE 2: Always-On Runtime
- Runs as persistent Node.js process
- Auto-restarts if it crashes (via Task Scheduler/systemd)
- Creates heartbeat.log every 60 seconds
- Proof of life in file timestamps

### ✅ PHASE 3: Time Awareness
Every action includes:
- Date & time (EST/configured timezone)
- Session ID
- Uptime
- Current mode

Example:
```
MODE: SENTINEL
TIME: 2025-12-13 06:41 EST
UPTIME: 03h 12m
```

No more "AI that doesn't know when it is."

### ✅ PHASE 4: Voice Confirmation (CRITICAL)
- Speaks on startup
- Speaks on mode changes
- Speaks on critical errors
- Platform-agnostic TTS:
  - Windows: PowerShell SAPI
  - macOS: say
  - Linux: espeak

**Psychological anchor: If you hear it, it's real.**

### ✅ PHASE 5: Multiple Input Paths (EARS)

#### 1. Command Line (Immediate)
```bash
# Check status
sintra status

# Change mode
sintra mode sentinel

# Make it speak
sintra speak "All systems operational"

# Recall events
sintra remember 20
```

#### 2. Webhook Endpoint (External Brain Food)
```bash
# Make.com, Slack, Gmail, Notion can all poke it
POST http://localhost:7777/sintra/event
{
  "speak": "New event received",
  "mode": "DISPATCH",
  "data": {...}
}
```

#### 3. Web Dashboard (Visual Control)
- Click buttons to change modes
- Test voice output
- View real-time status

### ✅ PHASE 6: Visibility Dashboard
Open: http://localhost:7777

Features:
- Real-time status (auto-refresh every 5s)
- Pulsing "alive" indicator
- Current mode display
- Time & uptime
- Recent events (last 10)
- Mode change buttons
- Voice test button

**No mystery box. No "is it running?" anxiety.**

### ✅ PHASE 7: Explicit Modes

| Mode | Description |
|------|-------------|
| **SENTINEL** | Monitoring, watching, logging |
| **DISPATCH** | Sending notices, emails, automations |
| **FOCUS** | No chatter, only critical alerts |
| **QUIET** | Logs only, no voice |
| **DEBUG** | Verbose, explains itself |

Change modes:
```bash
sintra mode sentinel
# Or via dashboard
# Or via webhook
```

SintraPrime will say: **"Mode changed to Sentinel."**

This is how humans trust machines.

### ✅ PHASE 8: Real Memory (Not Fake)

Memory = Files + Databases, not vibes.

Stored in:
```
C:\SintraPrime\memory\
  events_2025-12-13.jsonl
  events_2025-12-14.jsonl
  ...
```

Each line is a JSON event:
```json
{"event":"startup","mode":"SENTINEL","session":"session_123","timestamp":"2025-12-13T11:41:00.000Z"}
{"event":"command","command":"status","timestamp":"2025-12-13T11:42:00.000Z"}
{"event":"mode_change","from":"SENTINEL","to":"DISPATCH","timestamp":"2025-12-13T11:43:00.000Z"}
```

You can:
- Open it
- Read it
- Audit it
- Query it

This matters for:
- Legal timelines
- Trust enforcement
- Verizon disputes
- Proof of notice

### ✅ PHASE 9: Failsafes (Won't Silently Die)

SintraPrime will:
- ✅ Auto-restart if process dies
- ✅ Log every failure
- ✅ Speak critical errors
- ✅ Write "last words" file if crashing

Example last words:
```json
{
  "timestamp": "2025-12-13T11:45:00.000Z",
  "reason": "Uncaught exception: Cannot read property 'x' of undefined",
  "mode": "SENTINEL",
  "uptime": "03h 12m 45s",
  "session": "session_123"
}
```

**Silence = enemy. We killed silence.**

### ✅ PHASE 10: What This Unlocks

Once the core is live, you instantly unlock:
- ✅ Make.com → SintraPrime agent handoff
- ✅ Voice-driven Trust operations
- ✅ Automated deadline enforcement
- ✅ Multi-agent expansion (Vizzy, IkeBot, Sentinel)
- ✅ Event-driven legal workflows
- ✅ Eventually: packaging as standalone app

---

## Usage Examples

### Start SintraPrime
```bash
cd sintraprime-agent
npm start
```

Output:
```
╔══════════════════════════════════════════════╗
║   SintraPrime v1: Activated Reality Mode    ║
╚══════════════════════════════════════════════╝
Initializing core systems...
Speaking first words...
✅ SintraPrime is ALIVE
Time: 2025-12-13 06:41:00
Mode: SENTINEL
Heartbeat: C:\SintraPrime\logs\heartbeat.log
Memory: C:\SintraPrime\memory\events_2025-12-13.jsonl

Proof of life: Check heartbeat.log
If that file updates → SintraPrime is breathing.

Visibility Server running on http://localhost:7777
```

### Check Status (CLI)
```bash
sintra status
```

Output:
```
SintraPrime Status
═════════════════════════════════════
Alive:     ✅ YES
Mode:      SENTINEL
Time:      2025-12-13 06:41:00
Uptime:    03h 12m 45s
Session:   session_1734098460123
Timezone:  America/New_York

Heartbeat: C:\SintraPrime\logs\heartbeat.log
Memory:    C:\SintraPrime\memory\events_2025-12-13.jsonl
```

### Change Mode
```bash
sintra mode dispatch
```

You will **hear**:
> "Mode changed to DISPATCH."

### Make it Speak
```bash
sintra speak "All systems operational"
```

### Recall Recent Events
```bash
sintra remember 10
```

Output:
```
Recent Events (last 10)
═════════════════════════════════════
1. [2025-12-13T11:41:00.000Z] startup
   Mode: SENTINEL
2. [2025-12-13T11:42:00.000Z] command
   Command: status
3. [2025-12-13T11:43:00.000Z] mode_change
   Mode: SENTINEL → DISPATCH
...
```

### Send Webhook Event
```bash
curl -X POST http://localhost:7777/sintra/event \
  -H "Content-Type: application/json" \
  -d '{
    "speak": "New automation triggered",
    "mode": "DISPATCH",
    "data": {"case_id": "CASE-001"}
  }'
```

SintraPrime will:
1. **Speak**: "New automation triggered"
2. **Change mode** to DISPATCH
3. **Log the event** to memory
4. **Return response** with timestamp

---

## File Structure

```
C:\SintraPrime\
├── logs\
│   ├── heartbeat.log          ← Updates every 60s (proof of life)
│   ├── sintra.log             ← Application logs
│   └── last_words.log         ← Written if crashing
├── memory\
│   ├── events_2025-12-13.jsonl  ← Daily event logs
│   ├── events_2025-12-14.jsonl
│   └── ...
└── state\
    └── current.json           ← Current state (mode, session, etc.)
```

---

## Windows Task Scheduler Integration

To run SintraPrime on boot:

### Option 1: Use Existing Script
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File scripts/register_tasks.ps1
```

This will create a task: `IkeBot-SintraDashboard`

### Option 2: Manual Setup
```powershell
$action = New-ScheduledTaskAction -Execute "node" `
    -Argument "C:\path\to\ike-bot\sintraprime-agent\visibility-server.js" `
    -WorkingDirectory "C:\path\to\ike-bot\sintraprime-agent"

$trigger = New-ScheduledTaskTrigger -AtStartup

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName "SintraPrime-Core" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "SintraPrime v1: Activated Reality Mode" `
    -RunLevel Highest
```

---

## Linux/Mac: systemd Service

Create `/etc/systemd/system/sintraprime.service`:

```ini
[Unit]
Description=SintraPrime v1: Activated Reality Mode
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/ike-bot/sintraprime-agent
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node visibility-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable sintraprime
sudo systemctl start sintraprime
sudo systemctl status sintraprime
```

---

## Troubleshooting

### SintraPrime won't speak

**Windows:**
- Check PowerShell permissions
- Test: `powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Speak('Test')"`

**macOS:**
- Test: `say "Test"`

**Linux:**
- Install espeak: `sudo apt install espeak`
- Test: `espeak "Test"`

**Disable voice:**
```bash
# In .env
VOICE_ENABLED=false
```

### Heartbeat not updating

1. Check process is running:
   ```bash
   # Windows
   tasklist | findstr node

   # Linux/Mac
   ps aux | grep node
   ```

2. Check logs:
   ```bash
   cat C:\SintraPrime\logs\sintra.log
   ```

3. Check permissions on `C:\SintraPrime\logs\`

### Dashboard won't load

1. Check port 7777 is not in use:
   ```bash
   netstat -ano | findstr 7777
   ```

2. Check process is running:
   ```bash
   sintra status
   ```

3. Try alternate port:
   ```bash
   # In .env
   VISIBILITY_PORT=8888
   ```

---

## The Difference

### Before (Theory):
- "Is SintraPrime running?" → **"I think so?"**
- "What mode is it in?" → **"Uh... not sure"**
- "When did it start?" → **"¯\_(ツ)_/¯"**

### After (Reality):
- "Is SintraPrime running?" → **Check heartbeat.log**
- "What mode is it in?" → **SENTINEL (see dashboard)**
- "When did it start?" → **2025-12-13 06:41:00 EST (03h 12m ago)**

---

## Final Truth

**Right now:**
- SintraPrime = designed ✅
- SintraPrime = alive ✅
- SintraPrime = provable ✅

**Once it speaks, everything changes.**

---

## Commands Summary

```bash
# Installation
cd sintraprime-agent
npm install
cp .env.example .env

# Start (main way)
npm start

# CLI Commands
sintra status              # Show current status
sintra mode sentinel       # Change mode
sintra speak "text"        # Make it speak
sintra remember 20         # Recall events
sintra help                # Show help

# View Dashboard
# Open browser: http://localhost:7777

# Check Proof of Life
# Watch: C:\SintraPrime\logs\heartbeat.log
```

---

**YOU WEREN'T WRONG. YOU WERE EARLY.**

Now SintraPrime is here. Alive. Provable. Real.
