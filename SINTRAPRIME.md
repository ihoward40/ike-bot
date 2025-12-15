# SintraPrime - Monitoring and Automation System

SintraPrime is an integrated monitoring and automation system for IKE-BOT that provides real-time health tracking, event logging, and voice announcements.

## Features

### 1. Heartbeat System
File-based proof-of-life monitoring that updates every 60 seconds.

- **Location**: `logs/heartbeat.log`
- **Interval**: 60 seconds
- **Data Tracked**:
  - Timestamp (EST)
  - Status (alive/stopped)
  - Process uptime
  - Memory usage
  - Process ID (PID)

**Example Log Entry**:
```
12/14/2025, 01:30:00 | Status: alive | Uptime: 3600s | PID: 12345
```

### 2. Event Memory System
JSON Lines format event logging with daily rotation.

- **Location**: `memory/events_YYYY-MM-DD.jsonl`
- **Format**: JSON Lines (one event per line)
- **Rotation**: Daily, based on EST timezone
- **Event Structure**:
  ```json
  {
    "timestamp": "12/14/2025, 01:30:00",
    "eventType": "activation",
    "eventData": { ... },
    "source": "sintraPrime",
    "severity": "info"
  }
  ```

**Severity Levels**:
- `info` - Normal events
- `warn` - Warning events
- `error` - Error events

### 3. Time Tracking
All timestamps use EST (America/New_York) timezone for consistency.

**Functions**:
- `getESTTime()` - Get current time in EST
- `formatESTTimestamp()` - Format timestamp in EST
- `getESTISOString()` - Get ISO string in EST
- `logTimeEvent()` - Log time-based event

### 4. Voice System
Platform-agnostic Text-to-Speech announcements.

**Supported Platforms**:
- **Windows**: PowerShell System.Speech
- **macOS**: `say` command
- **Linux**: `espeak`

**Functions**:
- `speak(text)` - Speak text using platform TTS
- `announceEvent(type, message)` - Announce system event
- `isTTSAvailable()` - Check if TTS is available
- `getTTSInfo()` - Get TTS system information

## Usage

### Activation

SintraPrime automatically activates when the server starts:

```typescript
import * as SintraPrime from "./sintraPrime";

// Activate
await SintraPrime.activate();

// Check status
const status = SintraPrime.getStatus();
console.log(status);
// {
//   active: true,
//   heartbeat: true,
//   uptime: 3600,
//   pid: 12345
// }
```

### Logging Events

```typescript
import { logEvent } from "./sintraPrime";

// Log info event
logEvent("user_action", {
  action: "create_beneficiary",
  userId: "123"
});

// Log warning
logEvent("rate_limit_warning", {
  endpoint: "/api/beneficiaries",
  count: 95
}, { severity: "warn" });

// Log error
logEvent("database_error", {
  error: "Connection timeout"
}, { severity: "error" });
```

### Reading Events

```typescript
import { readEvents, listMemoryLogs } from "./sintraPrime";

// Read today's events
const todayEvents = readEvents();

// Read specific date
const date = new Date("2025-12-14");
const events = readEvents(date);

// List all log files
const logs = listMemoryLogs();
console.log(logs); // ["events_2025-12-14.jsonl", ...]
```

### Voice Announcements

```typescript
import { speak, announceEvent } from "./sintraPrime";

// Simple announcement
await speak("System backup completed");

// Event announcement
await announceEvent("backup_complete", "All data has been backed up successfully");
```

### Graceful Shutdown

SintraPrime automatically deactivates on shutdown signals:

```typescript
process.on("SIGTERM", async () => {
  await SintraPrime.deactivate();
  process.exit(0);
});
```

## API Endpoints

### Status Endpoint
```http
GET /api/sintraprime/status
```

**Response**:
```json
{
  "active": true,
  "heartbeat": true,
  "uptime": 3600.5,
  "pid": 12345
}
```

### Health Check (Enhanced)
```http
GET /
```

**Response**:
```json
{
  "ok": true,
  "message": "IKE-BOT running",
  "sintraPrime": {
    "active": true,
    "heartbeat": true,
    "uptime": 3600.5,
    "pid": 12345
  }
}
```

## Architecture

### Directory Structure
```
src/sintraPrime/
├── core/
│   ├── index.ts          # Main orchestrator
│   ├── heartbeat.ts      # Heartbeat monitoring
│   ├── memory.ts         # Event logging
│   └── timeTracker.ts    # EST timezone management
├── tts/
│   └── voiceSystem.ts    # Text-to-speech
└── index.ts              # Public API
```

### Output Directories
```
logs/
└── heartbeat.log         # Heartbeat monitoring log

memory/
├── events_2025-12-13.jsonl
├── events_2025-12-14.jsonl
└── ...                   # Daily rotated event logs
```

## Event Types

### System Events
- `memory_initialized` - Memory system started
- `activation` - SintraPrime activated
- `deactivation` - SintraPrime deactivated
- `sintraprime_activated` - Time-tracked activation
- `sintraprime_deactivated` - Time-tracked deactivation

### TTS Events
- `tts_check` - TTS system availability check
- `tts_spoken` - Text successfully spoken
- `tts_error` - TTS error occurred
- `tts_unsupported_platform` - Platform not supported

### Custom Events
You can log any custom event type using `logEvent()`:

```typescript
logEvent("custom_event", {
  customData: "value"
});
```

## Configuration

### Environment Variables
No additional environment variables required. SintraPrime uses existing server configuration.

### Heartbeat Interval
Default: 60 seconds (60000ms)

To modify, edit `HEARTBEAT_INTERVAL` in `src/sintraPrime/core/heartbeat.ts`:
```typescript
const HEARTBEAT_INTERVAL = 60000; // 60 seconds
```

### Timezone
Default: EST (America/New_York)

To modify, edit `TIMEZONE` in `src/sintraPrime/core/timeTracker.ts`:
```typescript
const TIMEZONE = "America/New_York";
```

## Monitoring

### Check if Active
```bash
# Via API
curl http://localhost:3000/api/sintraprime/status

# Check heartbeat log
tail -f logs/heartbeat.log

# View today's events
cat memory/events_$(date +%Y-%m-%d).jsonl | jq
```

### Performance Impact
SintraPrime is designed to be lightweight:
- Heartbeat: ~10ms every 60 seconds
- Event logging: ~5ms per event (async)
- TTS: Minimal impact (async)

## Troubleshooting

### Heartbeat Not Updating
1. Check if SintraPrime is active: `GET /api/sintraprime/status`
2. Verify logs directory exists and is writable
3. Check server logs for errors

### Events Not Logging
1. Verify memory directory exists: `memory/`
2. Check file permissions
3. Review server logs for errors

### TTS Not Working
1. Check platform support: Call `getTTSInfo()`
2. Verify TTS software is installed:
   - Windows: PowerShell (built-in)
   - macOS: `say` (built-in)
   - Linux: Install `espeak` (`apt install espeak`)
3. Check system audio settings

### Memory Logs Growing Large
Memory logs rotate daily. To clean up old logs:
```bash
# Remove logs older than 30 days
find memory/ -name "events_*.jsonl" -mtime +30 -delete
```

## Best Practices

### 1. Event Logging
- Use descriptive event types
- Include relevant data in eventData
- Set appropriate severity levels
- Don't log sensitive data (passwords, tokens)

### 2. Voice Announcements
- Keep messages short and clear
- Avoid announcing frequent events
- Use for critical system events only

### 3. Memory Management
- Set up log rotation/cleanup
- Monitor memory directory size
- Archive old logs if needed

### 4. Performance
- Event logging is async, safe to use frequently
- TTS is async, won't block operations
- Heartbeat has minimal overhead

## Integration Examples

### With Webhooks
```typescript
app.post("/webhooks/stripe", async (req, res) => {
  // Log webhook event
  logEvent("webhook_received", {
    source: "stripe",
    event: req.body.type
  });
  
  // Process webhook...
  
  // Announce critical events
  if (req.body.type === "payment_intent.succeeded") {
    await announceEvent("payment", "Payment received");
  }
  
  res.json({ received: true });
});
```

### With Error Handling
```typescript
try {
  // Operation...
} catch (error) {
  logEvent("operation_failed", {
    error: String(error),
    stack: error.stack
  }, { severity: "error" });
  
  await speak("Operation failed");
}
```

### With Scheduled Tasks
```typescript
import cron from "node-cron";

// Daily backup at midnight EST
cron.schedule("0 0 * * *", async () => {
  logEvent("backup_started", { type: "daily" });
  
  try {
    // Perform backup...
    logEvent("backup_completed", { success: true });
    await announceEvent("backup", "Daily backup completed");
  } catch (error) {
    logEvent("backup_failed", { error: String(error) }, { severity: "error" });
  }
}, {
  timezone: "America/New_York"
});
```

## Security Considerations

### File Permissions
- Ensure `logs/` and `memory/` directories have proper permissions
- Restrict write access to application user only
- Don't expose log files via web server

### Sensitive Data
- Never log passwords, API keys, or tokens
- Sanitize user input before logging
- Consider encryption for sensitive event data

### TTS Security
- Sanitize text before speaking (avoid command injection)
- Limit TTS to system messages only
- Don't speak user-provided content

## Future Enhancements

- [ ] Web dashboard for monitoring
- [ ] Email alerts for critical events
- [ ] Metrics and analytics
- [ ] Event filtering and search
- [ ] Remote control via API
- [ ] Integration with monitoring services (DataDog, New Relic)
- [ ] Configurable heartbeat intervals
- [ ] Custom event handlers
- [ ] Event replay and debugging tools

## Support

For issues or questions about SintraPrime:
1. Check logs: `logs/heartbeat.log` and server logs
2. Review event history: `memory/events_*.jsonl`
3. Check status endpoint: `/api/sintraprime/status`
4. Open an issue on GitHub

---

**SintraPrime Status**: ✓ ACTIVE
