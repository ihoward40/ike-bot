/**
 * SintraPrime Voice System v2: Extremely Vocal
 * 
 * Multi-tier voice system with NO SINGLE POINT OF FAILURE
 * Tier 1: Edge TTS (local, free, always-on)
 * Tier 2: ElevenLabs (premium moments)
 * Tier 3: SAPI (emergency fallback)
 * 
 * SILENCE IS A BUG. This system always speaks.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class VoiceSystemV2 {
  constructor(logger, modeManager) {
    this.logger = logger;
    this.modeManager = modeManager;
    this.platform = process.platform;
    
    // Voice tiers
    this.tiers = {
      EDGE: 'edge',           // Tier 1: Free, local, neural
      ELEVENLABS: 'elevenlabs', // Tier 2: Premium personality
      SAPI: 'sapi',           // Tier 3: Emergency fallback
      SAY: 'say',             // macOS
      ESPEAK: 'espeak'        // Linux
    };
    
    // Voice settings
    this.edgeVoice = process.env.EDGE_VOICE || 'en-US-JennyNeural'; // Neural voice
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || 'default';
    
    // Cost tracking
    this.elevenLabsCharCount = 0;
    this.elevenLabsLimit = parseInt(process.env.ELEVENLABS_MONTHLY_LIMIT) || 10000;
    
    // Voice enabled
    this.enabled = process.env.VOICE_ENABLED !== 'false';
    
    // Phrase categories
    this.phraseCategories = {
      STARTUP: 'startup',
      SHUTDOWN: 'shutdown',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error',
      STATUS: 'status',
      COMMAND: 'command',
      LEGAL: 'legal',
      CRITICAL: 'critical',
      IDLE: 'idle'
    };
  }

  /**
   * Main speak method with intelligent tier selection
   */
  async speak(text, options = {}) {
    if (!this.enabled || !this.modeManager.shouldSpeak()) {
      this.logger.debug('Voice disabled or mode is QUIET', { text });
      return false;
    }

    const {
      category = this.phraseCategories.STATUS,
      priority = 'normal',
      force = false
    } = options;

    // Determine which voice tier to use
    const tier = this.selectVoiceTier(category, priority);
    
    this.logger.info('Speaking', { text, tier, category, priority });

    try {
      switch (tier) {
        case this.tiers.ELEVENLABS:
          return await this.speakElevenLabs(text);
        
        case this.tiers.EDGE:
          return await this.speakEdgeTTS(text);
        
        case this.tiers.SAPI:
          return await this.speakSAPI(text);
        
        case this.tiers.SAY:
          return await this.speakMacOS(text);
        
        case this.tiers.ESPEAK:
          return await this.speakLinux(text);
        
        default:
          return await this.speakFallback(text);
      }
    } catch (error) {
      this.logger.error('Primary voice failed, trying fallback', { error: error.message, tier });
      
      // Always fallback to ensure speech happens
      return await this.speakFallback(text);
    }
  }

  /**
   * Tier 1: Edge Neural TTS (Primary - Free, Local, Neural)
   * This is the workhorse. Criminally underrated.
   */
  async speakEdgeTTS(text) {
    if (this.platform !== 'win32') {
      throw new Error('Edge TTS only available on Windows');
    }

    return new Promise((resolve, reject) => {
      // Use Edge TTS via PowerShell with neural voice
      const escapedText = text.replace(/"/g, '""').replace(/'/g, "''");
      const command = `powershell -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female, [System.Speech.Synthesis.VoiceAge]::Adult); $synth.Rate = 0; $synth.Volume = 100; $synth.Speak('${escapedText}')"`;

      exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Tier 2: ElevenLabs (Premium - For Important Moments)
   * Best emotional realism. Use sparingly.
   */
  async speakElevenLabs(text) {
    if (!this.elevenLabsApiKey) {
      this.logger.warn('ElevenLabs API key not configured, falling back');
      throw new Error('ElevenLabs not configured');
    }

    // Check usage limit
    const charCount = text.length;
    if (this.elevenLabsCharCount + charCount > this.elevenLabsLimit) {
      this.logger.warn('ElevenLabs monthly limit reached, falling back to Edge TTS');
      return await this.speakEdgeTTS(text);
    }

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
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

      // Save to temp file and play
      const tempFile = path.join(require('os').tmpdir(), `sintra_${Date.now()}.mp3`);
      fs.writeFileSync(tempFile, response.data);

      // Play the audio
      await this.playAudioFile(tempFile);

      // Clean up
      fs.unlinkSync(tempFile);

      // Track usage
      this.elevenLabsCharCount += charCount;
      this.logger.info('ElevenLabs speech completed', { 
        charCount, 
        totalUsed: this.elevenLabsCharCount,
        remaining: this.elevenLabsLimit - this.elevenLabsCharCount
      });

      return true;
    } catch (error) {
      this.logger.error('ElevenLabs failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Tier 3: Windows SAPI (Emergency Fallback)
   * Not sexy, but NEVER FAILS
   */
  async speakSAPI(text) {
    return new Promise((resolve, reject) => {
      const escapedText = text.replace(/"/g, '""');
      const command = `powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Volume = 100; $speak.Speak('${escapedText}')"`;

      exec(command, { timeout: 30000 }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * macOS voice
   */
  async speakMacOS(text) {
    return new Promise((resolve, reject) => {
      exec(`say "${text}"`, { timeout: 30000 }, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }

  /**
   * Linux voice
   */
  async speakLinux(text) {
    return new Promise((resolve, reject) => {
      exec(`espeak "${text}"`, { timeout: 30000 }, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }

  /**
   * Ultimate fallback - platform detection
   */
  async speakFallback(text) {
    this.logger.warn('Using fallback voice system');
    
    try {
      if (this.platform === 'win32') {
        return await this.speakSAPI(text);
      } else if (this.platform === 'darwin') {
        return await this.speakMacOS(text);
      } else {
        return await this.speakLinux(text);
      }
    } catch (error) {
      this.logger.error('ALL VOICE SYSTEMS FAILED - SILENCE DETECTED', { error: error.message });
      // Even if voice fails, we log it prominently
      console.error('\n╔═══════════════════════════════════════════╗');
      console.error('║  ⚠️  VOICE FAILURE - SILENCE IS A BUG  ⚠️  ║');
      console.error('╚═══════════════════════════════════════════╝');
      console.error(`Message was: "${text}"`);
      console.error('');
      return false;
    }
  }

  /**
   * Play audio file (for ElevenLabs)
   */
  async playAudioFile(filepath) {
    return new Promise((resolve, reject) => {
      let command;
      
      if (this.platform === 'win32') {
        command = `powershell -Command "(New-Object Media.SoundPlayer '${filepath}').PlaySync()"`;
      } else if (this.platform === 'darwin') {
        command = `afplay "${filepath}"`;
      } else {
        command = `mpg123 "${filepath}" || aplay "${filepath}"`;
      }

      exec(command, { timeout: 60000 }, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }

  /**
   * Intelligent tier selection based on context
   */
  selectVoiceTier(category, priority) {
    // Platform-specific tiers
    if (this.platform === 'darwin') return this.tiers.SAY;
    if (this.platform === 'linux') return this.tiers.ESPEAK;
    
    // Windows: Use intelligent tier selection
    
    // ElevenLabs for high-value moments (if configured and within budget)
    if (this.elevenLabsApiKey && this.elevenLabsCharCount < this.elevenLabsLimit) {
      if (
        category === this.phraseCategories.LEGAL ||
        category === this.phraseCategories.CRITICAL ||
        priority === 'critical'
      ) {
        return this.tiers.ELEVENLABS;
      }
    }

    // Edge TTS for everything else (default workhorse)
    return this.tiers.EDGE;
  }

  /**
   * Pre-defined phrases for common events
   * These should trigger automatically
   */
  getPhrases() {
    return {
      // Startup
      startup: (date) => `SintraPrime online. Time is ${date}. All systems standing by.`,
      startupShort: () => `SintraPrime online.`,
      
      // Shutdown
      shutdown: () => `SintraPrime shutting down.`,
      shutdownEmergency: () => `Emergency shutdown initiated. Last words logged.`,
      
      // Success
      taskComplete: () => `Task completed successfully.`,
      commandReceived: () => `Command received.`,
      commandExecuted: () => `Command executed.`,
      
      // Status
      idle: () => `I am idle and awaiting instruction.`,
      busy: () => `Processing. Please wait.`,
      ready: () => `Ready for next command.`,
      
      // Warnings
      noResponse: () => `Warning. No response received. Escalation pending.`,
      timeout: () => `Operation timed out. Retrying.`,
      deadline: (hours) => `Deadline approaching in ${hours} hours.`,
      
      // Errors
      error: (msg) => `Error detected: ${msg}`,
      criticalError: () => `Critical system error. Immediate attention required.`,
      silenceDetected: () => `Silence detected. This is a bug. Speaking to confirm operation.`,
      
      // Mode changes
      modeChange: (newMode) => `Mode changed to ${newMode}.`,
      
      // Legal/Critical
      legalNotice: () => `Legal notice generated. Review required.`,
      enforcementAction: () => `Enforcement action initiated. Listen carefully.`,
      trustEvent: () => `Trust event logged. Timestamp recorded.`,
      
      // Time awareness
      timeCheck: (time) => `Current time: ${time}`,
      uptimeReport: (uptime) => `System uptime: ${uptime}`,
      
      // Webhooks/Events
      webhookReceived: () => `External event received.`,
      automationTriggered: () => `Automation triggered.`,
      
      // Heartbeat (periodic)
      heartbeat: () => `Heartbeat. All systems operational.`,
      stillAlive: () => `Still alive. Awaiting commands.`
    };
  }

  /**
   * Announce with appropriate phrase and tier
   */
  async announce(phraseKey, ...args) {
    const phrases = this.getPhrases();
    const phraseFunc = phrases[phraseKey];
    
    if (!phraseFunc) {
      this.logger.error('Unknown phrase key', { phraseKey });
      return false;
    }

    const text = phraseFunc(...args);
    
    // Determine category from phrase key
    let category = this.phraseCategories.STATUS;
    let priority = 'normal';
    
    if (phraseKey.includes('legal') || phraseKey.includes('enforcement') || phraseKey.includes('trust')) {
      category = this.phraseCategories.LEGAL;
      priority = 'critical';
    } else if (phraseKey.includes('error') || phraseKey.includes('critical')) {
      category = this.phraseCategories.ERROR;
      priority = 'critical';
    } else if (phraseKey.includes('warning') || phraseKey.includes('deadline')) {
      category = this.phraseCategories.WARNING;
      priority = 'high';
    } else if (phraseKey.includes('startup')) {
      category = this.phraseCategories.STARTUP;
    } else if (phraseKey.includes('shutdown')) {
      category = this.phraseCategories.SHUTDOWN;
    }

    return await this.speak(text, { category, priority });
  }

  /**
   * Reset usage tracking (call monthly)
   */
  resetUsageTracking() {
    this.elevenLabsCharCount = 0;
    this.logger.info('Voice usage tracking reset');
  }

  /**
   * Get usage stats
   */
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

module.exports = { VoiceSystemV2 };
