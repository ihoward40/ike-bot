# SintraPrime v1: Activated Reality Mode

SintraPrime is an always-on, self-aware automation agent that runs alongside the IKE-BOT backend. It provides real-time monitoring, voice confirmations, and a dashboard to prove it's alive.

## Core Principles

**No vibes. No guessing. Just signals, outputs, and receipts.**

SintraPrime is "on" only when all three layers exist:
- **Brain** – logic + memory (Node.js runtime)
- **Ears** – input (commands/events/webhooks)
- **Mouth** – output (voice/logs/messages)

## Features

### 🧠 Brain - Always-On Runtime
- Persistent Node.js process
- Auto-restarts on crash
- Heartbeat logging every 60 seconds
- Session tracking with unique IDs
- Proof of life: `logs/heartbeat.log`

### ⏰ Time Awareness
SintraPrime always knows:
- Current date and time (EST timezone)
- System uptime since start
- Session duration
- Event timestamps

Every action includes:
- Timestamp
- Session ID
- Uptime
- Current mode

### 🔊 Mouth - Voice Confirmation
- Text-to-Speech (TTS) announcements
- Platform-agnostic (Windows/macOS/Linux)
- Startup confirmation: "SintraPrime online. Time is [date]. All systems standing by."
- Mode change confirmations
- Critical error alerts
- Can be silenced with QUIET mode

### 👂 Ears - Input Systems

#### 1. Command Line Interface
```bash
npm run sintra status      # Show current status
npm run sintra mode sentinel   # Change mode
npm run sintra events 20   # Show last 20 events
npm run sintra help        # Show help
```

#### 2. Webhook Endpoint
```
POST http://localhost:7777/sintra/event
Content-Type: application/json

{
  "type": "external_trigger",
  "data": {
    "source": "Make.com",
    "action": "notification_sent"
  }
}
```

#### 3. Dashboard API
- Status API: `GET http://localhost:7777/sintra/api/status`
- Events API: `GET http://localhost:7777/sintra/api/events?count=10`
- Mode Control: `POST http://localhost:7777/sintra/api/mode`

### 📊 Visibility - Dashboard

Access the live dashboard at: **http://localhost:7777**

The dashboard shows:
- ✅ Online/Offline status
- 🎯 Current mode
- ⏱️ Uptime and current time
- 🔑 Session ID
- 📈 Event count
- 💓 Last heartbeat timestamp
- 📋 Recent 10 events
- 🎮 Mode control buttons

Auto-refreshes every 5 seconds. No mystery box. No "is it running?" anxiety.

### 🎭 Modes

SintraPrime runs in explicit modes, not vibes:

| Mode | Description |
|------|-------------|
| **SENTINEL** | Monitoring, watching, logging (default) |
| **DISPATCH** | Sending notices, emails, automations |
| **FOCUS** | No chatter, only critical alerts |
| **QUIET** | Logs only, no voice |
| **DEBUG** | Verbose, explains itself |

Change modes via:
- Dashboard buttons
- CLI: `npm run sintra mode focus`
- API: `POST /sintra/api/mode`

### 🧠 Memory System

Real file-based storage, not fake AI memory:

**Event Log**: `memory/events_YYYY-MM-DD.jsonl`
- All events timestamped and logged
- JSON Lines format (one event per line)
- Includes type, data, mode, session ID, uptime

**Last Words**: `memory/last_words.json`
- Written on critical crashes
- Contains error details and last 5 events
- For debugging and trust enforcement

### 🛡️ Failsafes

SintraPrime won't silently die:
- ✅ Auto-restart on uncaught exceptions
- ✅ Comprehensive error logging
- ✅ Voice alerts for critical errors
- ✅ "Last words" file on crashes
- ✅ Graceful shutdown on SIGTERM/SIGINT

**Silence = enemy. We kill silence.**

## Installation & Setup

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- IKE-BOT repository

### 2. Environment Variables

Add to `.env`:
```env
PORT=3000              # Main API server port
SINTRA_PORT=7777       # SintraPrime dashboard port
```

### 3. Start SintraPrime

**Development mode** (with hot-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

SintraPrime will automatically:
1. Create `logs/` and `memory/` directories
2. Start the heartbeat logger
3. Announce startup via voice
4. Begin accepting events

### 4. Verify It's Running

**Check the dashboard**:
```
http://localhost:7777
```

**Check the heartbeat**:
```bash
tail -f logs/heartbeat.log
```

**Use the CLI**:
```bash
npm run sintra status
```

## File Structure

```
src/sintraPrime/
├── core/
│   ├── types.ts           # Core type definitions
│   ├── timeTracker.ts     # Time awareness system
│   ├── memory.ts          # File-based memory
│   ├── heartbeat.ts       # Heartbeat logger
│   └── sintraPrime.ts     # Main runtime (The Brain)
├── tts/
│   └── voiceSystem.ts     # Text-to-speech engine
├── cli/
│   ├── commands.ts        # CLI command handlers
│   └── sintra-cli.ts      # CLI executable
└── dashboard/
    └── routes.ts          # Web dashboard & API

logs/
├── heartbeat.log          # Human-readable heartbeat
└── heartbeat.json         # Machine-readable heartbeat

memory/
├── events_2025-12-13.jsonl  # Daily event logs
└── last_words.json          # Crash recovery data
```

## Integration Examples

### Make.com Integration
```javascript
// Send event to SintraPrime from Make.com webhook
POST http://localhost:7777/sintra/event
{
  "type": "automation_triggered",
  "data": {
    "scenario": "Credit Dispute Filing",
    "beneficiary_id": "uuid-here",
    "status": "completed"
  }
}
```

### Custom Automation
```typescript
import { getSintraPrime } from './sintraPrime/core/sintraPrime';

const sintra = getSintraPrime();

// Record custom events
sintra.recordEvent('custom_action', {
  action: 'enforcement_packet_generated',
  target: 'Verizon',
  documents: 3
});

// Change mode programmatically
await sintra.setMode(SintraMode.DISPATCH);

// Get status
const status = sintra.getStatus();
console.log(`SintraPrime is ${status.online ? 'ONLINE' : 'OFFLINE'}`);
```

## Monitoring & Debugging

### Check Heartbeat
```bash
# See last heartbeat
tail -n 1 logs/heartbeat.log

# Watch live
tail -f logs/heartbeat.log
```

### View Events
```bash
# Via CLI
npm run sintra events 50

# Via file (today's events)
cat memory/events_$(date +%Y-%m-%d).jsonl | jq .

# Check last words (after crash)
cat memory/last_words.json | jq .
```

### Debug Mode
```bash
# Enable verbose logging
npm run sintra mode debug

# Check dashboard
open http://localhost:7777
```

## API Reference

### Status API
```
GET /sintra/api/status

Response:
{
  "online": true,
  "mode": "SENTINEL",
  "time": "12/13/2025, 06:41:00",
  "uptime": "03h 12m 45s",
  "sessionId": "uuid-here",
  "eventCount": 42,
  "lastHeartbeat": "[SintraPrime] Alive — ..."
}
```

### Events API
```
GET /sintra/api/events?count=10

Response: [
  {
    "timestamp": "2025-12-13T11:41:00.000Z",
    "type": "startup",
    "data": { ... },
    "mode": "SENTINEL",
    "sessionId": "uuid-here",
    "uptime": "00h 00m 00s"
  },
  ...
]
```

### Mode Control API
```
POST /sintra/api/mode
Content-Type: application/json

{
  "mode": "FOCUS"
}

Response:
{
  "success": true,
  "mode": "FOCUS"
}
```

### Webhook Event API
```
POST /sintra/event
Content-Type: application/json

{
  "type": "external_event",
  "data": { ... }
}

Response:
{
  "success": true,
  "message": "Event recorded"
}
```

## Troubleshooting

### SintraPrime won't start
1. Check if port 7777 is available
2. Look at server logs for errors
3. Verify `logs/` and `memory/` directories are writable

### No voice output
- **Windows**: PowerShell might be restricted. Check execution policy.
- **Linux**: Install `espeak` or `spd-say`: `sudo apt-get install espeak`
- **macOS**: Built-in `say` command should work
- **Workaround**: Set mode to QUIET, voice is optional

### Dashboard not loading
1. Confirm SintraPrime started: `npm run sintra status`
2. Check port 7777: `lsof -i :7777` (Unix) or `netstat -ano | findstr 7777` (Windows)
3. Try accessing: http://localhost:7777 or http://127.0.0.1:7777

### Heartbeat not updating
1. Check file exists: `ls -l logs/heartbeat.log`
2. Verify permissions
3. Look for errors in server logs
4. Restart the application

## Production Deployment

### Windows Task Scheduler
1. Build the app: `npm run build`
2. Create a batch file: `start-sintraprime.bat`
   ```batch
   cd C:\path\to\ike-bot
   node dist/server.js
   ```
3. Task Scheduler → Create Basic Task
4. Trigger: At system startup
5. Action: Start a program → Point to batch file
6. Ensure "Run whether user is logged on or not" is checked

### Linux systemd Service
```ini
[Unit]
Description=SintraPrime Agent
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/ike-bot
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/sintraprime.log
StandardError=append:/var/log/sintraprime-error.log

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable sintraprime
sudo systemctl start sintraprime
```

## Security Considerations

- Dashboard runs on localhost by default (not exposed to internet)
- No authentication required (local-only access)
- For remote access, add authentication middleware
- Event data is stored locally in plain JSON (encrypt if sensitive)
- Voice announcements may contain system info (disable in production if needed)

## Future Enhancements

- [ ] Hotkey listener (Ctrl+Alt+S for voice input)
- [ ] Speech-to-text for voice commands
- [ ] ElevenLabs integration for better TTS
- [ ] Email/SMS notifications for critical events
- [ ] Web-based log viewer
- [ ] Event search and filtering
- [ ] Mode scheduling (auto-switch based on time)
- [ ] Multiple agent instances
- [ ] Distributed logging (send to remote server)

## Philosophy

> "This is how humans trust machines."

SintraPrime exists to eliminate uncertainty. You should never wonder if your automation is working. The heartbeat proves it's alive. The voice confirms actions. The dashboard shows everything. The memory proves what happened.

No vibes. No guessing. Just receipts.

---

**Ready to activate?**

```bash
npm run dev
# Listen for: "SintraPrime online. Time is December 13th, 2025. All systems standing by."
# Then visit: http://localhost:7777
```

Welcome to activated reality.
