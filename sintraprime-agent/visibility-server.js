/**
 * SintraPrime Visibility Server
 * PHASE 6: YOU CAN SEE IT
 * 
 * This provides a local dashboard and webhook endpoint
 * so you can SEE that SintraPrime is alive.
 */

const express = require('express');
const { SintraPrimeCore } = require('./core-agent');

const app = express();
app.use(express.json());

// Start the core agent
const core = new SintraPrimeCore();

// Store reference globally
global.sintraPrime = core;

// ========================================
// PHASE 6: Local Status Page (HTML Dashboard)
// ========================================

app.get('/', (req, res) => {
  const status = core.getStatus();
  const recentEvents = core.memorySystem.recall({}, 10);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>SintraPrime Control Panel</title>
  <meta http-equiv="refresh" content="5">
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #0a0e27;
      color: #00ff41;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border: 2px solid #00ff41;
      padding: 20px;
      margin-bottom: 30px;
      background: #0d1229;
    }
    .header h1 {
      margin: 0;
      font-size: 2.5em;
      text-shadow: 0 0 10px #00ff41;
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .status-card {
      border: 1px solid #00ff41;
      padding: 15px;
      background: #0d1229;
    }
    .status-card h3 {
      margin-top: 0;
      color: #00ffff;
      border-bottom: 1px solid #00ff41;
      padding-bottom: 5px;
    }
    .status-value {
      font-size: 1.5em;
      font-weight: bold;
      color: #fff;
    }
    .alive-indicator {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${status.alive ? '#00ff41' : '#ff0000'};
      box-shadow: 0 0 10px ${status.alive ? '#00ff41' : '#ff0000'};
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .events-section {
      border: 1px solid #00ff41;
      padding: 15px;
      background: #0d1229;
    }
    .events-section h3 {
      margin-top: 0;
      color: #00ffff;
    }
    .event {
      border-left: 3px solid #00ff41;
      padding: 10px;
      margin: 10px 0;
      background: #0a0e27;
    }
    .event-time {
      color: #888;
      font-size: 0.9em;
    }
    .controls {
      margin-top: 30px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      padding: 10px 20px;
      border: 1px solid #00ff41;
      background: #0d1229;
      color: #00ff41;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 1em;
    }
    .btn:hover {
      background: #00ff41;
      color: #0a0e27;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #888;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ SINTRA PRIME ⚡</h1>
    <p>Activated Reality Mode - Control Panel</p>
  </div>

  <div class="status-grid">
    <div class="status-card">
      <h3>Status</h3>
      <div class="status-value">
        <span class="alive-indicator"></span>
        ${status.alive ? 'ONLINE' : 'OFFLINE'}
      </div>
    </div>

    <div class="status-card">
      <h3>Mode</h3>
      <div class="status-value">${status.mode}</div>
    </div>

    <div class="status-card">
      <h3>Time</h3>
      <div class="status-value">${status.time}</div>
    </div>

    <div class="status-card">
      <h3>Uptime</h3>
      <div class="status-value">${status.uptime}</div>
    </div>

    <div class="status-card">
      <h3>Session</h3>
      <div class="status-value" style="font-size: 0.9em;">${status.session}</div>
    </div>

    <div class="status-card">
      <h3>Timezone</h3>
      <div class="status-value">${status.timezone}</div>
    </div>
  </div>

  <div class="events-section">
    <h3>📜 Recent Events (Last 10)</h3>
    ${recentEvents.length === 0 ? '<p>No events yet</p>' : ''}
    ${recentEvents.reverse().map(event => `
      <div class="event">
        <div class="event-time">${event.timestamp}</div>
        <div><strong>${event.event}</strong></div>
        ${event.command ? `<div>Command: ${event.command}</div>` : ''}
        ${event.from && event.to ? `<div>Mode: ${event.from} → ${event.to}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="controls">
    <button class="btn" onclick="changeMode('SENTINEL')">Mode: SENTINEL</button>
    <button class="btn" onclick="changeMode('DISPATCH')">Mode: DISPATCH</button>
    <button class="btn" onclick="changeMode('FOCUS')">Mode: FOCUS</button>
    <button class="btn" onclick="changeMode('QUIET')">Mode: QUIET</button>
    <button class="btn" onclick="changeMode('DEBUG')">Mode: DEBUG</button>
    <button class="btn" onclick="speak()">Test Voice</button>
  </div>

  <div class="footer">
    <p>Auto-refresh every 5 seconds</p>
    <p>Heartbeat: ${status.heartbeat}</p>
    <p>Memory: ${status.memory}</p>
    <p><strong>If this page loads → SintraPrime is alive.</strong></p>
    <p><strong>If heartbeat.log updates → SintraPrime is breathing.</strong></p>
  </div>

  <script>
    async function changeMode(mode) {
      const response = await fetch('/api/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const result = await response.json();
      alert('Mode changed to: ' + result.currentMode);
      location.reload();
    }

    async function speak() {
      const text = prompt('What should SintraPrime say?', 'SintraPrime is operational');
      if (text) {
        await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      }
    }
  </script>
</body>
</html>
  `;

  res.send(html);
});

// ========================================
// API Endpoints
// ========================================

// Status API
app.get('/api/status', (req, res) => {
  const status = core.getStatus();
  res.json(status);
});

// Mode change API
app.post('/api/mode', async (req, res) => {
  try {
    const { mode } = req.body;
    const result = await core.handleCommand('mode', { newMode: mode });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Speak API
app.post('/api/speak', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await core.handleCommand('speak', { text });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Events API
app.get('/api/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const events = core.memorySystem.recall({}, limit);
  res.json({ events, count: events.length });
});

// ========================================
// PHASE 5: EARS - Webhook Endpoint
// ========================================

app.post('/sintra/event', async (req, res) => {
  try {
    const event = req.body;
    
    core.logger.info('External event received', { event });
    
    core.memorySystem.remember({
      event: 'webhook',
      source: 'external',
      data: event
    });

    // Handle specific event types
    if (event.speak) {
      await core.voiceSystem.speak(event.speak);
    }

    if (event.mode) {
      await core.changeMode(event.mode);
    }

    res.json({
      success: true,
      received: event,
      timestamp: core.timeKeeper.isoString()
    });
  } catch (error) {
    core.logger.error('Webhook error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    alive: core.isAlive,
    mode: core.modeManager.getMode(),
    uptime: core.timeKeeper.uptime()
  });
});

// ========================================
// Start Server
// ========================================

async function start() {
  // Start the core agent first
  await core.startup();

  // Then start the HTTP server
  const port = process.env.VISIBILITY_PORT || 7777;
  
  app.listen(port, () => {
    core.logger.info(`Visibility Server running on http://localhost:${port}`);
    core.logger.info('');
    core.logger.info('═══════════════════════════════════════════════');
    core.logger.info('  OPEN YOUR BROWSER:');
    core.logger.info(`  http://localhost:${port}`);
    core.logger.info('═══════════════════════════════════════════════');
    core.logger.info('');
    
    core.memorySystem.remember({
      event: 'visibility_server_started',
      port
    });
  });
}

// Start if run directly
if (require.main === module) {
  start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { app, core };
