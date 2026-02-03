/**
 * SintraPrime Vocal Dominion v1
 * 
 * CORE RULE: Silence is failure. Whispering is weakness.
 * 
 * Multi-voice architecture with personality profiles, confidence scaling,
 * priority queuing, and extensive vocabulary.
 * 
 * This is not TTS slapped on an app. This is a vocal command system.
 */

const { VoiceSystemV2 } = require('./voice-system-v2');

// ========================================
// II. PERSONALITY PROFILES
// ========================================

const VOICES = {
  SINTRAPRIME: 'sintraprime',     // Primary Intelligence - Orchestrator
  SENTINEL: 'sentinel',            // Alert & Enforcement - Watcher
  ADVISOR: 'advisor',              // Analytical Counsel - Strategist
  VAULT_GUARDIAN: 'vault_guardian' // Record & Testimony - Archivist
};

// ========================================
// III. CONFIDENCE SCALING
// ========================================

const CONFIDENCE_LEVELS = {
  CALM: 1,        // Task completed successfully
  ATTENTIVE: 2,   // Awaiting confirmation
  FIRM: 3,        // No response, monitoring
  URGENT: 4,      // Warning, escalation imminent
  CRITICAL: 5     // Immediate action required
};

// ========================================
// IV. VOICE PRIORITY QUEUE
// ========================================

const PRIORITY = {
  [VOICES.SENTINEL]: 5,         // Highest - Critical alerts
  [VOICES.VAULT_GUARDIAN]: 4,   // Record statements
  [VOICES.SINTRAPRIME]: 3,      // System narration
  [VOICES.ADVISOR]: 2,          // Analysis
  AMBIENT: 1                    // Idle speech
};

class VocalDominion {
  constructor(voiceSystem, logger, timeKeeper) {
    this.voiceSystem = voiceSystem;
    this.logger = logger;
    this.timeKeeper = timeKeeper;
    
    // Voice queue system
    this.queue = [];
    this.currentlySpeaking = null;
    this.interruptedSpeech = null;
    
    // Vocabulary engine
    this.vocabulary = this.initializeVocabulary();
    
    // Voice characteristics
    this.voiceProfiles = this.initializeVoiceProfiles();
    
    // Event tracking for time-based narration
    this.eventTimestamps = new Map();
    
    // Idle timer
    this.lastActivity = Date.now();
    this.idleThreshold = 300000; // 5 minutes
    this.idleCheckInterval = null;
  }

  /**
   * Initialize voice profiles with characteristics
   */
  initializeVoiceProfiles() {
    return {
      [VOICES.SINTRAPRIME]: {
        name: 'SintraPrime',
        tone: 'calm, articulate, omnipresent',
        vocabularyTier: 'broad',
        authority: 'orchestrator',
        rate: 0,       // Normal speed
        pitch: 0       // Normal pitch
      },
      [VOICES.SENTINEL]: {
        name: 'Sentinel',
        tone: 'firm, clipped, unmistakable',
        vocabularyTier: 'tactical',
        authority: 'enforcer',
        rate: -1,      // Slightly slower for emphasis
        pitch: -2      // Lower for authority
      },
      [VOICES.ADVISOR]: {
        name: 'Advisor',
        tone: 'thoughtful, measured, instructive',
        vocabularyTier: 'analytical',
        authority: 'counsel',
        rate: 0,
        pitch: 0
      },
      [VOICES.VAULT_GUARDIAN]: {
        name: 'Vault Guardian',
        tone: 'formal, authoritative, immutable',
        vocabularyTier: 'legal',
        authority: 'witness',
        rate: -2,      // Deliberate pace
        pitch: -1      // Slightly lower for gravity
      }
    };
  }

  /**
   * VI. EXTENSIVE VOCABULARY ENGINE
   * Multiple phrasings per intent to prevent robotic repetition
   */
  initializeVocabulary() {
    return {
      // Startup variants
      startup: {
        [VOICES.SINTRAPRIME]: [
          (date) => `SintraPrime online. Current time is ${date}. All systems nominal. Monitoring active workflows.`,
          (date) => `System initialization complete. Time is ${date}. All subsystems operational.`,
          (date) => `SintraPrime activated. ${date}. Ready to proceed.`,
          (date) => `Core systems online as of ${date}. Standing by for commands.`
        ]
      },

      // Shutdown variants
      shutdown: {
        [VOICES.SINTRAPRIME]: [
          'SintraPrime shutting down. All states preserved.',
          'System shutdown initiated. Records synchronized.',
          'Terminating processes. Session concluded.',
          'Shutting down cleanly. All data secured.'
        ],
        [VOICES.SENTINEL]: [
          'Emergency shutdown. Last words logged.',
          'Critical termination. State preserved for analysis.',
          'Forced shutdown detected. Failsafe engaged.'
        ]
      },

      // Task completion variants
      taskComplete: {
        [VOICES.SINTRAPRIME]: [
          'Task completed.',
          'Operation successful.',
          'Action finalized without error.',
          'Process concluded as expected.',
          'Objective achieved.',
          'Execution complete.'
        ]
      },

      // Command acknowledgment
      commandReceived: {
        [VOICES.SINTRAPRIME]: [
          'Command received.',
          'Acknowledged.',
          'Understood. Processing.',
          'Confirmed. Executing.',
          'Directive noted.'
        ]
      },

      // Warnings (confidence escalation)
      warning: {
        [VOICES.SENTINEL]: {
          [CONFIDENCE_LEVELS.ATTENTIVE]: [
            'Attention. Awaiting confirmation.',
            'Notice sent. Monitoring for response.',
            'Action pending external acknowledgment.'
          ],
          [CONFIDENCE_LEVELS.FIRM]: [
            'No response received. Monitoring escalation threshold.',
            'Acknowledgment window expiring. Escalation protocol active.',
            'External silence detected. Tracking elapsed time.'
          ],
          [CONFIDENCE_LEVELS.URGENT]: [
            'Warning. Escalation imminent.',
            'Response deadline approaching. Prepare for escalation.',
            'Threshold reached. Escalation protocol armed.'
          ],
          [CONFIDENCE_LEVELS.CRITICAL]: [
            'Immediate action required. System entering enforcement mode.',
            'Critical threshold exceeded. Escalation executing.',
            'Emergency escalation. Manual intervention required.'
          ]
        }
      },

      // Status checks
      status: {
        [VOICES.SINTRAPRIME]: [
          'All systems operational.',
          'Status nominal. Continuing operations.',
          'No anomalies detected. Monitoring continues.',
          'Systems green. Standing by.'
        ]
      },

      // Idle state
      idle: {
        [VOICES.SINTRAPRIME]: [
          'System idle. All monitors active.',
          'Awaiting commands. All systems ready.',
          'No pending operations. Standing by.',
          'Idle state. Monitoring continues.'
        ]
      },

      // Record statements (Vault Guardian)
      record: {
        [VOICES.VAULT_GUARDIAN]: [
          (timestamp) => `For the record: Notice transmitted ${timestamp}. No response logged.`,
          (timestamp) => `Official record: Event occurred ${timestamp}. Documentation complete.`,
          (timestamp) => `Timestamp ${timestamp}. Action recorded for evidentiary purposes.`,
          (timestamp) => `Entered into record: ${timestamp}. Witness statements preserved.`
        ]
      },

      // Time-based narration
      timeElapsed: {
        [VOICES.VAULT_GUARDIAN]: [
          (hours) => `${hours} hours have elapsed since notice was issued.`,
          (hours) => `Time elapsed: ${hours} hours. No acknowledgment received.`,
          (hours) => `${hours} hour deadline has passed without response.`
        ],
        [VOICES.SENTINEL]: [
          (hours) => `${hours} hours. No response. Escalation threshold approaching.`,
          (hours) => `${hours} hour window expired. Initiating next protocol.`
        ]
      },

      // Decision support (Advisor)
      advice: {
        [VOICES.ADVISOR]: [
          (recommendation) => `Based on prior outcomes and current data, the recommended action is ${recommendation}.`,
          (recommendation) => `Analysis suggests ${recommendation} as the optimal path forward.`,
          (recommendation) => `Given the context, ${recommendation} aligns with established procedures.`
        ]
      },

      // Mode changes
      modeChange: {
        [VOICES.SINTRAPRIME]: [
          (mode) => `Mode changed to ${mode}.`,
          (mode) => `Entering ${mode} mode.`,
          (mode) => `System now operating in ${mode} mode.`,
          (mode) => `${mode} mode activated.`
        ]
      },

      // Errors
      error: {
        [VOICES.SENTINEL]: [
          (msg) => `Error detected: ${msg}`,
          (msg) => `Fault condition: ${msg}. Diagnostic in progress.`,
          (msg) => `System error: ${msg}. Investigating root cause.`
        ]
      }
    };
  }

  /**
   * Main speak method with voice selection and priority queueing
   */
  async speak(text, options = {}) {
    const {
      voice = VOICES.SINTRAPRIME,
      confidence = CONFIDENCE_LEVELS.CALM,
      priority = PRIORITY[voice] || PRIORITY.AMBIENT,
      category = 'status',
      forceImmediate = false,
      recordTimestamp = null
    } = options;

    const utterance = {
      text,
      voice,
      confidence,
      priority,
      category,
      timestamp: Date.now(),
      recordTimestamp
    };

    // Track activity
    this.lastActivity = Date.now();

    // Log the intent
    this.logger.info('Vocal intent', { 
      voice, 
      confidence, 
      priority, 
      textPreview: text.substring(0, 50) 
    });

    // Priority queue logic
    if (forceImmediate || this.shouldInterrupt(utterance)) {
      return await this.speakImmediately(utterance);
    } else {
      this.queue.push(utterance);
      this.queue.sort((a, b) => b.priority - a.priority);
      
      if (!this.currentlySpeaking) {
        return await this.processQueue();
      }
    }
  }

  /**
   * IV. Check if high-priority speech should interrupt
   */
  shouldInterrupt(newUtterance) {
    if (!this.currentlySpeaking) return false;
    
    // Higher priority interrupts lower priority
    return newUtterance.priority > this.currentlySpeaking.priority;
  }

  /**
   * Speak immediately, interrupting if necessary
   */
  async speakImmediately(utterance) {
    // Interrupt current speech if needed
    if (this.currentlySpeaking) {
      this.logger.warn('Speech interrupted', {
        interrupted: this.currentlySpeaking.voice,
        interruptedBy: utterance.voice
      });
      
      // Save interrupted speech for potential resume
      if (this.currentlySpeaking.priority >= PRIORITY.SINTRAPRIME) {
        this.interruptedSpeech = this.currentlySpeaking;
      }
    }

    this.currentlySpeaking = utterance;
    
    try {
      await this.voiceSystem.speak(utterance.text, {
        category: utterance.category,
        priority: utterance.confidence >= CONFIDENCE_LEVELS.URGENT ? 'critical' : 'normal'
      });
      
      // Record if this was a Vault Guardian statement
      if (utterance.voice === VOICES.VAULT_GUARDIAN && utterance.recordTimestamp) {
        this.recordStatement(utterance);
      }
      
      this.currentlySpeaking = null;
      
      // Resume interrupted speech if important
      if (this.interruptedSpeech) {
        const toResume = this.interruptedSpeech;
        this.interruptedSpeech = null;
        
        this.logger.info('Resuming interrupted speech', { voice: toResume.voice });
        await this.speak(toResume.text, toResume);
      }
      
      // Process next in queue
      await this.processQueue();
      
    } catch (error) {
      this.logger.error('Speech failed', { error: error.message, utterance });
      this.currentlySpeaking = null;
    }
  }

  /**
   * Process the priority queue
   */
  async processQueue() {
    if (this.currentlySpeaking || this.queue.length === 0) return;
    
    const next = this.queue.shift();
    await this.speakImmediately(next);
  }

  /**
   * VI. Get variant phrase from vocabulary (prevents repetition)
   */
  getPhrase(category, voice, ...args) {
    const variants = this.vocabulary[category]?.[voice];
    
    if (!variants) {
      this.logger.warn('No vocabulary for category/voice', { category, voice });
      return null;
    }

    // Handle confidence-level variants (for warnings)
    if (typeof variants === 'object' && !Array.isArray(variants)) {
      const confidenceLevel = args[0];
      const confidenceVariants = variants[confidenceLevel];
      if (!confidenceVariants) return null;
      
      const index = Math.floor(Math.random() * confidenceVariants.length);
      return confidenceVariants[index];
    }

    // Handle simple array variants
    if (Array.isArray(variants)) {
      const index = Math.floor(Math.random() * variants.length);
      const phraseFunc = variants[index];
      
      return typeof phraseFunc === 'function' ? phraseFunc(...args) : phraseFunc;
    }

    return null;
  }

  /**
   * High-level announce methods for each voice
   */

  // SintraPrime (Primary Intelligence)
  async announceSintraPrime(category, ...args) {
    const text = this.getPhrase(category, VOICES.SINTRAPRIME, ...args);
    if (!text) return;
    
    await this.speak(text, {
      voice: VOICES.SINTRAPRIME,
      confidence: CONFIDENCE_LEVELS.CALM,
      category
    });
  }

  // Sentinel (Alert & Enforcement)
  async announceSentinel(category, confidence, ...args) {
    const text = this.getPhrase(category, VOICES.SENTINEL, confidence, ...args);
    if (!text) return;
    
    await this.speak(text, {
      voice: VOICES.SENTINEL,
      confidence,
      category,
      forceImmediate: confidence >= CONFIDENCE_LEVELS.URGENT
    });
  }

  // Advisor (Analytical Counsel)
  async announceAdvisor(category, ...args) {
    const text = this.getPhrase(category, VOICES.ADVISOR, ...args);
    if (!text) return;
    
    await this.speak(text, {
      voice: VOICES.ADVISOR,
      confidence: CONFIDENCE_LEVELS.ATTENTIVE,
      category
    });
  }

  // Vault Guardian (Record & Testimony)
  async announceVaultGuardian(category, ...args) {
    const text = this.getPhrase(category, VOICES.VAULT_GUARDIAN, ...args);
    if (!text) return;
    
    await this.speak(text, {
      voice: VOICES.VAULT_GUARDIAN,
      confidence: CONFIDENCE_LEVELS.FIRM,
      category,
      forceImmediate: true,
      recordTimestamp: Date.now()
    });
  }

  /**
   * V. TIME-BASED NARRATION
   * Track events and announce elapsed time
   */
  trackEvent(eventId, eventType, timestamp = Date.now()) {
    this.eventTimestamps.set(eventId, {
      type: eventType,
      timestamp,
      announced: []
    });
    
    this.logger.info('Event tracked for time-based narration', { eventId, eventType });
  }

  async checkTimeElapsed(eventId, thresholds = [24, 48, 72]) {
    const event = this.eventTimestamps.get(eventId);
    if (!event) return;
    
    const elapsed = Date.now() - event.timestamp;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    
    for (const threshold of thresholds) {
      if (hours >= threshold && !event.announced.includes(threshold)) {
        event.announced.push(threshold);
        
        // Escalate confidence based on time
        let confidence = CONFIDENCE_LEVELS.ATTENTIVE;
        if (hours >= 72) confidence = CONFIDENCE_LEVELS.CRITICAL;
        else if (hours >= 48) confidence = CONFIDENCE_LEVELS.URGENT;
        else if (hours >= 24) confidence = CONFIDENCE_LEVELS.FIRM;
        
        // Choose voice based on severity
        if (confidence >= CONFIDENCE_LEVELS.URGENT) {
          await this.announceSentinel('timeElapsed', confidence, hours);
        } else {
          await this.announceVaultGuardian('timeElapsed', hours);
        }
      }
    }
  }

  /**
   * Record statement for legal/evidentiary purposes
   */
  recordStatement(utterance) {
    const record = {
      timestamp: utterance.recordTimestamp || Date.now(),
      voice: utterance.voice,
      statement: utterance.text,
      context: utterance.category,
      session: this.timeKeeper?.sessionId
    };
    
    this.logger.info('Statement recorded for evidentiary purposes', record);
    
    // Could also write to separate legal record file
    // this.writeToLegalRecord(record);
  }

  /**
   * VIII. DEFAULT BEHAVIOR - Idle monitoring
   * Speak if nothing has happened for too long
   */
  startIdleMonitoring() {
    if (this.idleCheckInterval) return;
    
    this.idleCheckInterval = setInterval(async () => {
      const idleTime = Date.now() - this.lastActivity;
      
      if (idleTime >= this.idleThreshold) {
        await this.announceSintraPrime('idle');
        this.lastActivity = Date.now(); // Reset to avoid spam
      }
    }, 60000); // Check every minute
  }

  stopIdleMonitoring() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }

  /**
   * Convenience methods for common scenarios
   */

  async startup(date) {
    await this.announceSintraPrime('startup', date);
    this.startIdleMonitoring();
  }

  async shutdown() {
    this.stopIdleMonitoring();
    await this.announceSintraPrime('shutdown');
  }

  async taskComplete() {
    await this.announceSintraPrime('taskComplete');
  }

  async commandReceived() {
    await this.announceSintraPrime('commandReceived');
  }

  async warning(confidence, message) {
    await this.speak(message, {
      voice: VOICES.SENTINEL,
      confidence,
      category: 'warning',
      forceImmediate: confidence >= CONFIDENCE_LEVELS.URGENT
    });
  }

  async error(message) {
    const text = this.getPhrase('error', VOICES.SENTINEL, message);
    await this.speak(text, {
      voice: VOICES.SENTINEL,
      confidence: CONFIDENCE_LEVELS.URGENT,
      category: 'error',
      forceImmediate: true
    });
  }

  async recordNotice(timestamp, details) {
    await this.announceVaultGuardian('record', timestamp);
    this.trackEvent(details.noticeId, 'notice_sent', timestamp);
  }

  async modeChange(newMode) {
    await this.announceSintraPrime('modeChange', newMode);
  }

  async provideAdvice(recommendation) {
    await this.announceAdvisor('advice', recommendation);
  }

  /**
   * Get system stats
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      currentlySpeaking: this.currentlySpeaking ? this.currentlySpeaking.voice : null,
      trackedEvents: this.eventTimestamps.size,
      lastActivity: new Date(this.lastActivity).toISOString(),
      idleMonitoring: this.idleCheckInterval !== null
    };
  }
}

module.exports = { 
  VocalDominion,
  VOICES,
  CONFIDENCE_LEVELS,
  PRIORITY
};
