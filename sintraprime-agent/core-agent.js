/**
 * SintraPrime v1: Activated Reality Mode
 * Core Agent - The Brain
 * 
 * This is not theory. This is not vibes. This is proof of life.
 * If this runs → SintraPrime is alive.
 * If this speaks → SintraPrime is conscious.
 * If this logs → SintraPrime is provable.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createLogger, format, transports } = require('winston');

// ========================================
// PHASE 1 & 2: BRAIN - Always-On Runtime
// ========================================

const SINTRA_ROOT = process.env.SINTRA_ROOT || 'C:\\SintraPrime';
const LOG_DIR = path.join(SINTRA_ROOT, 'logs');
const MEMORY_DIR = path.join(SINTRA_ROOT, 'memory');
const STATE_DIR = path.join(SINTRA_ROOT, 'state');
const HEARTBEAT_FILE = path.join(LOG_DIR, 'heartbeat.log');
const STATE_FILE = path.join(STATE_DIR, 'current.json');
const LAST_WORDS_FILE = path.join(LOG_DIR, 'last_words.log');

// Ensure all directories exist
[LOG_DIR, MEMORY_DIR, STATE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ========================================
// PHASE 3: TIME AWARENESS
// ========================================

class TimeKeeper {
  constructor() {
    this.timezone = process.env.TZ || 'America/New_York';
    this.startTime = new Date();
    this.sessionId = `session_${Date.now()}`;
  }

  now() {
    return new Date();
  }

  formatted() {
    return this.now().toLocaleString('en-US', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  uptime() {
    const ms = Date.now() - this.startTime.getTime();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  isoString() {
    return this.now().toISOString();
  }
}

// ========================================
// PHASE 7: MODES
// ========================================

const MODES = {
  SENTINEL: 'SENTINEL',    // monitoring, watching, logging
  DISPATCH: 'DISPATCH',    // sending notices, emails, automations
  FOCUS: 'FOCUS',          // no chatter, only critical alerts
  QUIET: 'QUIET',          // logs only, no voice
  DEBUG: 'DEBUG'           // verbose, explains itself
};

class ModeManager {
  constructor() {
    this.currentMode = MODES.SENTINEL;
    this.history = [];
  }

  setMode(newMode) {
    if (!MODES[newMode]) {
      throw new Error(`Invalid mode: ${newMode}. Valid modes: ${Object.keys(MODES).join(', ')}`);
    }
    
    const oldMode = this.currentMode;
    this.currentMode = newMode;
    
    this.history.push({
      from: oldMode,
      to: newMode,
      timestamp: new Date().toISOString()
    });

    return { oldMode, newMode };
  }

  getMode() {
    return this.currentMode;
  }

  shouldSpeak() {
    return this.currentMode !== MODES.QUIET;
  }

  shouldBeVerbose() {
    return this.currentMode === MODES.DEBUG;
  }
}

// ========================================
// PHASE 4: MOUTH - Voice Confirmation
// ========================================

class VoiceSystem {
  constructor(modeManager) {
    this.modeManager = modeManager;
    this.platform = process.platform;
    this.enabled = process.env.VOICE_ENABLED !== 'false';
  }

  speak(text) {
    if (!this.enabled || !this.modeManager.shouldSpeak()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let command;
      
      if (this.platform === 'win32') {
        // Windows: PowerShell with SAPI
        const escapedText = text.replace(/"/g, '""');
        command = `powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Speak('${escapedText}')"`;
      } else if (this.platform === 'darwin') {
        // macOS
        command = `say "${text}"`;
      } else {
        // Linux
        command = `espeak "${text}" 2>/dev/null || echo "${text}"`;
      }

      exec(command, (error) => {
        if (error) {
          console.log(`[Voice] Could not speak (${error.message}), but continuing...`);
        }
        resolve();
      });
    });
  }

  async announceStartup(timeKeeper) {
    const date = timeKeeper.now().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    await this.speak(`SintraPrime online. Time is ${date}. All systems standing by.`);
  }

  async announceModeChange(oldMode, newMode) {
    await this.speak(`Mode changed to ${newMode}.`);
  }

  async announceError(error) {
    if (this.modeManager.getMode() === MODES.FOCUS || this.modeManager.getMode() === MODES.QUIET) {
      return; // Only speak critical errors in focused modes
    }
    await this.speak(`Error detected: ${error}`);
  }
}

// ========================================
// PHASE 8: MEMORY - Real, Not Fake
// ========================================

class MemorySystem {
  constructor(memoryDir) {
    this.memoryDir = memoryDir;
    this.eventLog = null;
    this.rotateLogIfNeeded();
  }

  rotateLogIfNeeded() {
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.memoryDir, `events_${today}.jsonl`);
    
    if (this.eventLog !== logFile) {
      this.eventLog = logFile;
    }
  }

  remember(event) {
    this.rotateLogIfNeeded();
    
    const entry = {
      ...event,
      timestamp: new Date().toISOString(),
      session: global.sintraPrime?.timeKeeper?.sessionId
    };

    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.eventLog, line);
    
    return entry;
  }

  recall(filter = {}, limit = 100) {
    this.rotateLogIfNeeded();
    
    if (!fs.existsSync(this.eventLog)) {
      return [];
    }

    const lines = fs.readFileSync(this.eventLog, 'utf8').trim().split('\n');
    const events = lines
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .slice(-limit);

    return events;
  }
}

// ========================================
// CORE AGENT: The Brain
// ========================================

class SintraPrimeCore {
  constructor() {
    this.timeKeeper = new TimeKeeper();
    this.modeManager = new ModeManager();
    this.voiceSystem = new VoiceSystem(this.modeManager);
    this.memorySystem = new MemorySystem(MEMORY_DIR);
    this.isAlive = false;
    this.heartbeatInterval = null;
    
    // Configure logger
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(info => {
              const time = this.timeKeeper.formatted();
              const mode = this.modeManager.getMode();
              return `[${time}] [${mode}] ${info.level}: ${info.message}`;
            })
          )
        }),
        new transports.File({ 
          filename: path.join(LOG_DIR, 'sintra.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // Make this globally accessible
    global.sintraPrime = this;
  }

  // ========================================
  // PHASE 2: Heartbeat - Proof of Life
  // ========================================

  updateHeartbeat() {
    const time = this.timeKeeper.formatted();
    const mode = this.modeManager.getMode();
    const uptime = this.timeKeeper.uptime();
    
    const heartbeat = `[SintraPrime] Alive — ${time} EST\nMode: ${mode}\nUptime: ${uptime}\nSession: ${this.timeKeeper.sessionId}\n\n`;
    
    fs.writeFileSync(HEARTBEAT_FILE, heartbeat);
    
    if (this.modeManager.shouldBeVerbose()) {
      this.logger.debug('Heartbeat updated', { time, mode, uptime });
    }
  }

  startHeartbeat() {
    this.updateHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat();
    }, 60000); // Every 60 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ========================================
  // State Management
  // ========================================

  saveState() {
    const state = {
      mode: this.modeManager.getMode(),
      session: this.timeKeeper.sessionId,
      startTime: this.timeKeeper.startTime.toISOString(),
      currentTime: this.timeKeeper.isoString(),
      uptime: this.timeKeeper.uptime(),
      isAlive: this.isAlive,
      modeHistory: this.modeManager.history
    };

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  }

  loadState() {
    if (fs.existsSync(STATE_FILE)) {
      try {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        return state;
      } catch (error) {
        this.logger.error('Failed to load state', { error: error.message });
      }
    }
    return null;
  }

  // ========================================
  // PHASE 9: Failsafes
  // ========================================

  writeLastWords(reason) {
    const lastWords = {
      timestamp: this.timeKeeper.isoString(),
      reason,
      mode: this.modeManager.getMode(),
      uptime: this.timeKeeper.uptime(),
      session: this.timeKeeper.sessionId
    };

    fs.writeFileSync(LAST_WORDS_FILE, JSON.stringify(lastWords, null, 2));
    this.logger.error('Last words written', lastWords);
  }

  setupFailsafes() {
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      this.logger.info('SIGTERM received, shutting down gracefully...');
      await this.shutdown('SIGTERM');
    });

    process.on('SIGINT', async () => {
      this.logger.info('SIGINT received, shutting down gracefully...');
      await this.shutdown('SIGINT');
    });

    // Crash handlers
    process.on('uncaughtException', async (error) => {
      this.logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      await this.voiceSystem.speak('Critical error detected. SintraPrime shutting down.');
      this.writeLastWords(`Uncaught exception: ${error.message}`);
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      this.logger.error('Unhandled rejection', { reason });
      await this.voiceSystem.speak('Unhandled error detected.');
      this.writeLastWords(`Unhandled rejection: ${reason}`);
    });
  }

  // ========================================
  // Lifecycle
  // ========================================

  async startup() {
    this.logger.info('╔══════════════════════════════════════════════╗');
    this.logger.info('║   SintraPrime v1: Activated Reality Mode    ║');
    this.logger.info('╚══════════════════════════════════════════════╝');
    
    this.logger.info('Initializing core systems...');
    
    // Log system info
    this.logger.info('System Info', {
      platform: process.platform,
      node: process.version,
      timezone: this.timeKeeper.timezone,
      sessionId: this.timeKeeper.sessionId
    });

    // Setup failsafes
    this.setupFailsafes();

    // Start heartbeat
    this.startHeartbeat();

    // Mark as alive
    this.isAlive = true;
    this.saveState();

    // Remember startup
    this.memorySystem.remember({
      event: 'startup',
      mode: this.modeManager.getMode(),
      session: this.timeKeeper.sessionId
    });

    // Speak first words (PHASE 4)
    this.logger.info('Speaking first words...');
    await this.voiceSystem.announceStartup(this.timeKeeper);
    
    this.logger.info('✅ SintraPrime is ALIVE');
    this.logger.info(`Time: ${this.timeKeeper.formatted()}`);
    this.logger.info(`Mode: ${this.modeManager.getMode()}`);
    this.logger.info(`Heartbeat: ${HEARTBEAT_FILE}`);
    this.logger.info(`Memory: ${this.memorySystem.eventLog}`);
    this.logger.info('');
    this.logger.info('Proof of life: Check heartbeat.log');
    this.logger.info('If that file updates → SintraPrime is breathing.');
    this.logger.info('');
  }

  async shutdown(reason = 'shutdown') {
    this.logger.info(`Shutting down: ${reason}`);
    
    this.isAlive = false;
    this.stopHeartbeat();
    this.saveState();
    
    this.memorySystem.remember({
      event: 'shutdown',
      reason,
      uptime: this.timeKeeper.uptime()
    });

    await this.voiceSystem.speak('SintraPrime shutting down.');
    
    this.logger.info('Shutdown complete');
    process.exit(0);
  }

  // ========================================
  // Command Interface (PHASE 5: EARS)
  // ========================================

  async handleCommand(command, args = {}) {
    this.logger.info(`Command received: ${command}`, args);
    
    this.memorySystem.remember({
      event: 'command',
      command,
      args
    });

    switch (command.toLowerCase()) {
      case 'status':
        return this.getStatus();
      
      case 'mode':
        if (args.newMode) {
          return await this.changeMode(args.newMode);
        }
        return { mode: this.modeManager.getMode() };
      
      case 'speak':
        if (args.text) {
          await this.voiceSystem.speak(args.text);
          return { spoken: args.text };
        }
        return { error: 'No text provided' };
      
      case 'remember':
        return this.memorySystem.recall(args.filter, args.limit);
      
      case 'shutdown':
        await this.shutdown('manual');
        return { status: 'shutting down' };
      
      default:
        return { error: `Unknown command: ${command}` };
    }
  }

  async changeMode(newMode) {
    const upperMode = newMode.toUpperCase();
    const { oldMode, newMode: actualNewMode } = this.modeManager.setMode(upperMode);
    
    this.logger.info(`Mode changed: ${oldMode} → ${actualNewMode}`);
    
    this.memorySystem.remember({
      event: 'mode_change',
      from: oldMode,
      to: actualNewMode
    });

    this.saveState();
    
    await this.voiceSystem.announceModeChange(oldMode, actualNewMode);
    
    return {
      success: true,
      previousMode: oldMode,
      currentMode: actualNewMode
    };
  }

  getStatus() {
    return {
      alive: this.isAlive,
      mode: this.modeManager.getMode(),
      time: this.timeKeeper.formatted(),
      uptime: this.timeKeeper.uptime(),
      session: this.timeKeeper.sessionId,
      heartbeat: HEARTBEAT_FILE,
      memory: this.memorySystem.eventLog,
      timezone: this.timeKeeper.timezone
    };
  }
}

// ========================================
// CLI Interface (PHASE 5: EARS - Command Line)
// ========================================

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('SintraPrime CLI');
    console.log('');
    console.log('Commands:');
    console.log('  status              - Show current status');
    console.log('  mode [MODE]         - Change mode (SENTINEL, DISPATCH, FOCUS, QUIET, DEBUG)');
    console.log('  speak "text"        - Make SintraPrime speak');
    console.log('  remember [limit]    - Recall recent events');
    console.log('  daemon              - Run as persistent daemon');
    console.log('');
    return;
  }

  // For daemon mode, start the full agent
  if (command === 'daemon') {
    const core = new SintraPrimeCore();
    await core.startup();
    
    // Keep running
    return new Promise(() => {}); // Intentionally never resolves
  }

  // For other commands, just execute and exit
  const core = new SintraPrimeCore();
  core.isAlive = true; // Quick commands don't need full startup
  
  const result = await core.handleCommand(command, {
    newMode: args[1],
    text: args.slice(1).join(' '),
    limit: parseInt(args[1]) || 10
  });

  console.log(JSON.stringify(result, null, 2));
}

// ========================================
// Export for use as module
// ========================================

module.exports = {
  SintraPrimeCore,
  MODES,
  SINTRA_ROOT
};

// ========================================
// Run if executed directly
// ========================================

if (require.main === module) {
  runCLI().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
