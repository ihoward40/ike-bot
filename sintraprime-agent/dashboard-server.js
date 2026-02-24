/**
 * SintraPrime Dashboard Server
 * Handles events, mode changes, and webhook piping between IKE Bot services
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

const app = express();
app.use(express.json());

const PORT = process.env.SINTRA_PORT || 5011;
const MODE_FILE = process.env.MODE_FILE || './data/current_mode.json';
const HEARTBEAT_FILE = process.env.HEARTBEAT_FILE || './logs/heartbeat.log';

// Ensure directories exist
['./data', './logs', './memory'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: './logs/sintra-dashboard.log' })
  ]
});

// In-memory state
let currentMode = loadMode();
let eventHistory = [];

// Load mode from disk
function loadMode() {
  try {
    if (fs.existsSync(MODE_FILE)) {
      const data = fs.readFileSync(MODE_FILE, 'utf8');
      const mode = JSON.parse(data);
      logger.info('Mode loaded from disk', { mode: mode.mode });
      return mode;
    }
  } catch (error) {
    logger.error('Failed to load mode', { error: error.message });
  }
  return { mode: 'idle', timestamp: new Date().toISOString(), metadata: {} };
}

// Save mode to disk
function saveMode(mode) {
  try {
    fs.writeFileSync(MODE_FILE, JSON.stringify(mode, null, 2));
    logger.info('Mode saved to disk', { mode: mode.mode });
  } catch (error) {
    logger.error('Failed to save mode', { error: error.message });
  }
}

// Log event to JSON Lines file
function logEvent(event) {
  try {
    const date = new Date().toISOString().split('T')[0];
    const eventLogFile = `./memory/events_${date}.jsonl`;
    const eventLine = JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    }) + '\n';
    fs.appendFileSync(eventLogFile, eventLine);
    logger.debug('Event logged', { event_type: event.event_type });
  } catch (error) {
    logger.error('Failed to log event', { error: error.message });
  }
}

// Update heartbeat
function updateHeartbeat() {
  try {
    const timestamp = new Date().toISOString();
    fs.writeFileSync(HEARTBEAT_FILE, `${timestamp}\n${currentMode.mode}\n`);
  } catch (error) {
    logger.error('Failed to update heartbeat', { error: error.message });
  }
}

// Forward event to IKE Bot services
async function forwardToIkeBot(event) {
  const urls = [];
  
  // Determine which services to notify
  if (event.target === 'flask' || !event.target) {
    urls.push(`${process.env.IKE_BOT_FLASK_URL}/run-agent`);
  }
  if (event.target === 'fastapi' || !event.target) {
    urls.push(`${process.env.IKE_BOT_FASTAPI_URL}/api/v2/run-agent`);
  }
  
  for (const url of urls) {
    try {
      await axios.post(url, event, { timeout: 5000 });
      logger.info('Event forwarded to IKE Bot', { url, event_type: event.event_type });
    } catch (error) {
      logger.warn('Failed to forward event', { url, error: error.message });
    }
  }
}

// Routes

app.get('/', (req, res) => {
  res.json({
    service: 'SintraPrime Dashboard',
    version: '1.0.0',
    status: 'running',
    current_mode: currentMode.mode,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    healthy: true,
    mode: currentMode.mode,
    heartbeat_file: fs.existsSync(HEARTBEAT_FILE),
    mode_file: fs.existsSync(MODE_FILE)
  });
});

// Get current mode
app.get('/mode', (req, res) => {
  res.json(currentMode);
});

// Set mode
app.post('/mode', (req, res) => {
  const { mode, metadata } = req.body;
  
  if (!mode) {
    return res.status(400).json({ error: 'Mode is required' });
  }
  
  const previousMode = currentMode.mode;
  currentMode = {
    mode,
    previous_mode: previousMode,
    timestamp: new Date().toISOString(),
    metadata: metadata || {}
  };
  
  saveMode(currentMode);
  updateHeartbeat();
  
  logger.info('Mode changed', { from: previousMode, to: mode });
  
  // Log mode change as event
  logEvent({
    event_type: 'mode_changed',
    from_mode: previousMode,
    to_mode: mode,
    metadata
  });
  
  res.json({
    success: true,
    mode: currentMode.mode,
    previous_mode: previousMode
  });
});

// Receive events
app.post('/event', async (req, res) => {
  const event = req.body;
  
  logger.info('Event received', { 
    event_type: event.event_type,
    source: event.source 
  });
  
  // Add to history
  eventHistory.push({
    ...event,
    received_at: new Date().toISOString()
  });
  
  // Keep only last 100 events in memory
  if (eventHistory.length > 100) {
    eventHistory.shift();
  }
  
  // Log to file
  logEvent(event);
  
  // Forward to IKE Bot if needed
  if (event.forward_to_ike_bot) {
    await forwardToIkeBot(event);
  }
  
  res.json({
    success: true,
    event_id: event.event_id || `evt_${Date.now()}`,
    received_at: new Date().toISOString()
  });
});

// Get event history
app.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const events = eventHistory.slice(-limit);
  res.json({
    events,
    total: eventHistory.length,
    current_mode: currentMode.mode
  });
});

// Trigger Flask endpoints
app.post('/trigger/flask/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  const payload = req.body;
  
  try {
    const url = `${process.env.IKE_BOT_FLASK_URL}/${endpoint}`;
    logger.info('Triggering Flask endpoint', { url });
    
    const response = await axios.post(url, payload, { timeout: 10000 });
    
    logEvent({
      event_type: 'flask_triggered',
      endpoint,
      payload,
      response: response.data
    });
    
    res.json({
      success: true,
      endpoint,
      response: response.data
    });
  } catch (error) {
    logger.error('Flask trigger failed', { endpoint, error: error.message });
    res.status(500).json({
      error: error.message,
      endpoint
    });
  }
});

// Heartbeat endpoint
app.get('/heartbeat', (req, res) => {
  updateHeartbeat();
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    mode: currentMode.mode
  });
});

// Get fingerprints (scenarios/blueprints loaded)
app.get('/fingerprints', (req, res) => {
  try {
    const templatesDir = path.join(__dirname, '../src/config/templates');
    let blueprints = [];
    
    if (fs.existsSync(templatesDir)) {
      const files = fs.readdirSync(templatesDir);
      blueprints = files.filter(f => f.endsWith('.blueprint.json')).map(f => {
        const content = fs.readFileSync(path.join(templatesDir, f), 'utf8');
        const blueprint = JSON.parse(content);
        return {
          filename: f,
          name: blueprint.name,
          version: blueprint.version,
          description: blueprint.description
        };
      });
    }
    
    logger.info('Fingerprints retrieved', { count: blueprints.length });
    
    res.json({
      blueprints,
      count: blueprints.length,
      templates_dir: templatesDir
    });
  } catch (error) {
    logger.error('Failed to get fingerprints', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`SintraPrime Dashboard running on http://localhost:${PORT}`);
  logger.info(`Current mode: ${currentMode.mode}`);
  
  // Initialize heartbeat
  updateHeartbeat();
  
  // Start heartbeat interval
  const heartbeatInterval = parseInt(process.env.HEARTBEAT_INTERVAL) || 60;
  setInterval(updateHeartbeat, heartbeatInterval * 1000);
  logger.info(`Heartbeat interval: ${heartbeatInterval}s`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  saveMode(currentMode);
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  saveMode(currentMode);
  process.exit(0);
});
