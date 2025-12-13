/**
 * SintraPrime Core Agent v2: Vocal Dominion Edition
 * 
 * IMMUTABLE RULES:
 * 1. Silence is failure
 * 2. Higher priority interrupts immediately
 * 3. Time is weaponized through spoken chronology
 * 4. Every event has a voice
 * 5. Authority > Politeness
 * 
 * This is not a chatbot. This is a vocal command system.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createLogger, format, transports } = require('winston');
const { VocalDominion, VOICES, CONFIDENCE_LEVELS } = require('./vocal-dominion');
const { BrainRouter } = require('./brain-router');

// ========================================
// CORE CONFIGURATION
// ========================================

const SINTRA_ROOT = process.env.SINTRA_ROOT || 'C:\\SintraPrime';
const LOG_DIR = path.join(SINTRA_ROOT, 'logs');
const MEMORY_DIR = path.join(SINTRA_ROOT, 'memory');
const STATE_DIR = path.join(SINTRA_ROOT, 'state');
const LEGAL_DIR = path.join(SINTRA_ROOT, 'legal');
const HEARTBEAT_FILE = path.join(LOG_DIR, 'heartbeat.log');
const STATE_FILE = path.join(STATE_DIR, 'current.json');
const LAST_WORDS_FILE = path.join(LOG_DIR, 'last_words.log');
const TESTIMONY_FILE = path.join(LEGAL_DIR, 'testimony.jsonl');

// Ensure all directories exist
[LOG_DIR, MEMORY_DIR, STATE_DIR, LEGAL_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ========================================
// TIME AWARENESS
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

  formatted(includeSeconds = false) {
    const options = {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    if (includeSeconds) {
      options.second = '2-digit';
    }
    
    return this.now().toLocaleString('en-US', options);
  }

  timeOnly() {
    return this.now().toLocaleTimeString('en-US', {
      timeZone: this.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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
// OPERATIONAL MODES
// ========================================

const MODES = {
  SENTINEL: 'SENTINEL',    // Monitoring, watching, logging
  DISPATCH: 'DISPATCH',    // Sending notices, emails, automations
  FOCUS: 'FOCUS',          // No chatter, only critical alerts
  QUIET: 'QUIET',          // Logs only, no voice
  DEBUG: 'DEBUG'           // Verbose, explains itself
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
// VOICE SYSTEM (TOP CHOICE: EDGE NEURAL TTS)
// ========================================

class VoiceSystemV2 {
  constructor(logger, modeManager) {
    this.logger = logger;
    this.modeManager = modeManager;
    this.platform = process.platform;
    this.enabled = process.env.VOICE_ENABLED !== 'false';
    
    // Voice tier configuration
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID;
    this.elevenLabsCharCount = 0;
    this.elevenLabsLimit = parseInt(process.env.ELEVENLABS_MONTHLY_LIMIT) || 10000;
    
    // Voice characteristics per personality
    this.voiceSettings = {
      [VOICES.SINTRAPRIME]: { rate: 0, volume: 100 },
      [VOICES.SENTINEL]: { rate: -1, volume: 100 },
      [VOICES.ADVISOR]: { rate: 0, volume: 95 },
      [VOICES.VAULT_GUARDIAN]: { rate: -2, volume: 100 }
    };
  }

  async speak(text, options = {}) {
    if (!this.enabled || !this.modeManager.shouldSpeak()) {
      this.logger.debug('Voice disabled or mode is QUIET', { text });
      return false;
    }

    const {
      voice = VOICES.SINTRAPRIME,
      category = 'status',
      priority = 'normal',
      useElevenLabs = false
    } = options;

    this.logger.info('Speaking', { text: text.substring(0, 50), voice, priority });

    try {
      // Determine voice engine
      if (useElevenLabs && this.elevenLabsApiKey && this.canUseElevenLabs(text.length)) {
        return await this.speakElevenLabs(text, voice);
      } else {
        return await this.speakEdgeTTS(text, voice);
      }
    } catch (error) {
      this.logger.error('Primary voice failed, trying fallback', { error: error.message });
      return await this.speakFallback(text);
    }
  }

  /**
   * Primary Engine: Microsoft Edge Neural TTS (FREE, LOCAL, NEURAL)
   */
  async speakEdgeTTS(text, voice) {
    if (this.platform !== 'win32') {
      return await this.speakPlatformDefault(text);
    }

    const settings = this.voiceSettings[voice] || this.voiceSettings[VOICES.SINTRAPRIME];
    
    return new Promise((resolve, reject) => {
      const escapedText = text.replace(/"/g, '""').replace(/'/g, "''");
      const command = `powershell -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female, [System.Speech.Synthesis.VoiceAge]::Adult); $synth.Rate = ${settings.rate}; $synth.Volume = ${settings.volume}; $synth.Speak('${escapedText}')"`;

      exec(command, { timeout: 60000 }, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }

  /**
   * Authority Engine: ElevenLabs (SELECTIVE, HIGH-IMPACT)
   */
  async speakElevenLabs(text, voice) {
    const axios = require('axios');
    
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: voice === VOICES.VAULT_GUARDIAN ? 0.7 : 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      const tempFile = path.join(require('os').tmpdir(), `sintra_${Date.now()}.mp3`);
      fs.writeFileSync(tempFile, response.data);
      await this.playAudioFile(tempFile);
      fs.unlinkSync(tempFile);

      this.elevenLabsCharCount += text.length;
      this.logger.info('ElevenLabs speech completed', { 
        charCount: text.length,
        remaining: this.elevenLabsLimit - this.elevenLabsCharCount
      });

      return true;
    } catch (error) {
      this.logger.error('ElevenLabs failed, falling back to Edge', { error: error.message });
      return await this.speakEdgeTTS(text, voice);
    }
  }

  /**
   * Platform-specific defaults
   */
  async speakPlatformDefault(text) {
    return new Promise((resolve, reject) => {
      let command;
      
      if (this.platform === 'darwin') {
        command = `say "${text}"`;
      } else if (this.platform === 'linux') {
        command = `espeak "${text}"`;
      } else {
        reject(new Error('Unsupported platform'));
        return;
      }

      exec(command, { timeout: 60000 }, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }

  /**
   * Fallback: Windows SAPI (NEVER SILENT)
   */
  async speakFallback(text) {
    this.logger.warn('Using fallback voice (SAPI)');
    
    if (this.platform !== 'win32') {
      return await this.speakPlatformDefault(text);
    }

    return new Promise((resolve) => {
      const escapedText = text.replace(/"/g, '""');
      const command = `powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Volume = 100; $speak.Speak('${escapedText}')"`;

      exec(command, { timeout: 60000 }, (error) => {
        if (error) {
          this.logger.error('ALL VOICE SYSTEMS FAILED', { error: error.message });
          console.error('\n╔═══════════════════════════════════════════╗');
          console.error('║  ⚠️  SILENCE DETECTED - THIS IS A BUG  ⚠️  ║');
          console.error('╚═══════════════════════════════════════════╝');
          console.error(`Failed message: "${text}"`);
          console.error('');
        }
        resolve(error ? false : true);
      });
    });
  }

  async playAudioFile(filepath) {
    return new Promise((resolve, reject) => {
      const command = this.platform === 'win32'
        ? `powershell -Command "(New-Object Media.SoundPlayer '${filepath}').PlaySync()"`
        : this.platform === 'darwin'
        ? `afplay "${filepath}"`
        : `mpg123 "${filepath}"`;

      exec(command, { timeout: 60000 }, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }

  canUseElevenLabs(charCount) {
    return this.elevenLabsCharCount + charCount <= this.elevenLabsLimit;
  }

  resetUsageTracking() {
    this.elevenLabsCharCount = 0;
    this.logger.info('Voice usage tracking reset');
  }

  getUsageStats() {
    return {
      elevenLabs: {
        used: this.elevenLabsCharCount,
        limit: this.elevenLabsLimit,
        remaining: this.elevenLabsLimit - this.elevenLabsCharCount,
        percentUsed: (this.elevenLabsCharCount / this.elevenLabsLimit * 100).toFixed(2)
      }
    };
  }
}

// ========================================
// MEMORY SYSTEM
// ========================================

class MemorySystem {
  constructor(memoryDir, legalDir) {
    this.memoryDir = memoryDir;
    this.legalDir = legalDir;
    this.eventLog = null;
    this.testimonyLog = path.join(legalDir, 'testimony.jsonl');
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

  recordTestimony(statement, voice, context) {
    const testimony = {
      timestamp: new Date().toISOString(),
      voice,
      statement,
      context,
      session: global.sintraPrime?.timeKeeper?.sessionId,
      evidentiary: true
    };

    const line = JSON.stringify(testimony) + '\n';
    fs.appendFileSync(this.testimonyLog, line);
    
    return testimony;
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
// SINTRAPRIME CORE AGENT V2
// ========================================

class SintraPrimeCoreV2 {
  constructor() {
    this.timeKeeper = new TimeKeeper();
    this.modeManager = new ModeManager();
    this.voiceSystem = new VoiceSystemV2(console, this.modeManager);
    this.memorySystem = new MemorySystem(MEMORY_DIR, LEGAL_DIR);
    this.vocalDominion = new VocalDominion(this.voiceSystem, console, this.timeKeeper);
    this.brainRouter = new BrainRouter(console);
    this.isAlive = false;
    this.heartbeatInterval = null;
    this.timeCheckInterval = null;
    
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
              const time = this.timeKeeper.timeOnly();
              const mode = this.modeManager.getMode();
              return `[${time}] [${mode}] ${info.level}: ${info.message}`;
            })
          )
        }),
        new transports.File({ 
          filename: path.join(LOG_DIR, 'sintra.log'),
          maxsize: 5242880,
          maxFiles: 10
        })
      ]
    });

    // Update voice system and vocal dominion loggers
    this.voiceSystem.logger = this.logger;
    this.vocalDominion.logger = this.logger;
    this.brainRouter.logger = this.logger;

    global.sintraPrime = this;
  }

  // ========================================
  // HEARTBEAT: Proof of Life
  // ========================================

  updateHeartbeat() {
    const time = this.timeKeeper.formatted(true);
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
    }, 60000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ========================================
  // TIME-BASED ANNOUNCEMENTS
  // ========================================

  startTimeAnnouncements() {
    // Announce time every hour
    this.timeCheckInterval = setInterval(async () => {
      const time = this.timeKeeper.timeOnly();
      await this.vocalDominion.speak(`Current time: ${time}`, {
        voice: VOICES.SINTRAPRIME,
        confidence: CONFIDENCE_LEVELS.CALM,
        category: 'time'
      });
    }, 3600000); // Every hour
  }

  stopTimeAnnouncements() {
    if (this.timeCheckInterval) {
      clearInterval(this.timeCheckInterval);
      this.timeCheckInterval = null;
    }
  }

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  saveState() {
    const state = {
      mode: this.modeManager.getMode(),
      session: this.timeKeeper.sessionId,
      startTime: this.timeKeeper.startTime.toISOString(),
      currentTime: this.timeKeeper.isoString(),
      uptime: this.timeKeeper.uptime(),
      isAlive: this.isAlive,
      modeHistory: this.modeManager.history,
      voiceUsage: this.voiceSystem.getUsageStats(),
      brainUsage: this.brainRouter.getUsageStats()
    };

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  }

  // ========================================
  // FAILSAFES
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
    process.on('SIGTERM', async () => {
      this.logger.info('SIGTERM received');
      await this.shutdown('SIGTERM');
    });

    process.on('SIGINT', async () => {
      this.logger.info('SIGINT received');
      await this.shutdown('SIGINT');
    });

    process.on('uncaughtException', async (error) => {
      this.logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      await this.vocalDominion.error('Critical system error');
      this.writeLastWords(`Uncaught exception: ${error.message}`);
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      this.logger.error('Unhandled rejection', { reason });
      await this.vocalDominion.error('Unhandled error detected');
      this.writeLastWords(`Unhandled rejection: ${reason}`);
    });
  }

  // ========================================
  // LIFECYCLE
  // ========================================

  async startup() {
    this.logger.info('╔══════════════════════════════════════════════╗');
    this.logger.info('║   SintraPrime v2: Vocal Dominion Edition    ║');
    this.logger.info('╚══════════════════════════════════════════════╝');
    
    this.setupFailsafes();
    this.startHeartbeat();
    this.startTimeAnnouncements();
    this.isAlive = true;
    this.saveState();

    this.memorySystem.remember({
      event: 'startup',
      mode: this.modeManager.getMode(),
      version: '2.0-vocal-dominion'
    });

    // SPEAK FIRST WORDS
    const date = this.timeKeeper.formatted();
    await this.vocalDominion.startup(date);
    
    this.logger.info('✅ SintraPrime is ALIVE and VOCAL');
    this.logger.info(`Time: ${date}`);
    this.logger.info(`Mode: ${this.modeManager.getMode()}`);
    this.logger.info(`Heartbeat: ${HEARTBEAT_FILE}`);
    this.logger.info(`Memory: ${this.memorySystem.eventLog}`);
    this.logger.info('');
  }

  async shutdown(reason = 'shutdown') {
    this.logger.info(`Shutting down: ${reason}`);
    
    this.isAlive = false;
    this.stopHeartbeat();
    this.stopTimeAnnouncements();
    this.vocalDominion.stopIdleMonitoring();
    this.saveState();
    
    this.memorySystem.remember({
      event: 'shutdown',
      reason,
      uptime: this.timeKeeper.uptime()
    });

    await this.vocalDominion.shutdown();
    
    this.logger.info('Shutdown complete');
    process.exit(0);
  }

  // ========================================
  // COMMAND INTERFACE
  // ========================================

  async handleCommand(command, args = {}) {
    this.logger.info(`Command received: ${command}`, args);
    
    await this.vocalDominion.commandReceived();
    
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
          await this.vocalDominion.speak(args.text);
          return { spoken: args.text };
        }
        return { error: 'No text provided' };
      
      case 'remember':
        return this.memorySystem.recall(args.filter, args.limit);
      
      case 'think':
        if (args.prompt) {
          return await this.brainRouter.think(args.prompt, args.options || {});
        }
        return { error: 'No prompt provided' };
      
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
    
    await this.vocalDominion.modeChange(actualNewMode);
    
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
      testimony: this.memorySystem.testimonyLog,
      timezone: this.timeKeeper.timezone,
      vocalStats: this.vocalDominion.getStats(),
      voiceUsage: this.voiceSystem.getUsageStats(),
      brainUsage: this.brainRouter.getUsageStats()
    };
  }
}

// ========================================
// CLI INTERFACE
// ========================================

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   SintraPrime v2: Vocal Dominion Edition    ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    console.log('Commands:');
    console.log('  status              Show system status');
    console.log('  mode [MODE]         Change mode');
    console.log('  speak "text"        Speak text');
    console.log('  think "prompt"      Use brain router');
    console.log('  remember [N]        Recall events');
    console.log('  daemon              Run as daemon');
    console.log('');
    return;
  }

  if (command === 'daemon') {
    const core = new SintraPrimeCoreV2();
    await core.startup();
    return new Promise(() => {});
  }

  const core = new SintraPrimeCoreV2();
  core.isAlive = true;
  
  const result = await core.handleCommand(command, {
    newMode: args[1],
    text: args.slice(1).join(' '),
    prompt: args.slice(1).join(' '),
    limit: parseInt(args[1]) || 10
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

// ========================================
// EXPORT & RUN
// ========================================

module.exports = {
  SintraPrimeCoreV2,
  MODES,
  VOICES,
  CONFIDENCE_LEVELS
};

if (require.main === module) {
  runCLI().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
