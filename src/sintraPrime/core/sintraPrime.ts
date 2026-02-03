// SintraPrime Core Runtime - The Brain

import { v4 as uuidv4 } from 'uuid';
import { SintraMode, SintraState, SintraEvent } from './types';
import { TimeTracker } from './timeTracker';
import { MemorySystem } from './memory';
import { HeartbeatSystem } from './heartbeat';
import { VoiceSystem } from '../tts/voiceSystem';
import { logger } from '../../config/logger';

export class SintraPrime {
  private state: SintraState;
  private timeTracker: TimeTracker;
  private memory: MemorySystem;
  private heartbeat: HeartbeatSystem;
  private voice: VoiceSystem;
  private isRunning: boolean = false;

  constructor() {
    this.state = {
      mode: SintraMode.SENTINEL,
      startTime: new Date(),
      sessionId: uuidv4(),
      timezone: 'EST',
      lastHeartbeat: new Date(),
      eventCount: 0
    };

    this.timeTracker = new TimeTracker();
    this.memory = new MemorySystem();
    this.heartbeat = new HeartbeatSystem();
    this.voice = new VoiceSystem();

    // Load today's events from disk
    this.memory.loadTodaysEvents();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('SintraPrime already running');
      return;
    }

    this.isRunning = true;
    logger.info({ sessionId: this.state.sessionId }, 'SintraPrime starting...');

    try {
      // Start heartbeat
      this.heartbeat.start(() => this.getHeartbeatState());

      // Announce startup
      const formattedTime = this.timeTracker.getFormattedTime();
      await this.voice.announceStartup(formattedTime);

      // Record startup event
      this.recordEvent('startup', {
        sessionId: this.state.sessionId,
        time: formattedTime
      });

      logger.info({ 
        mode: this.state.mode,
        sessionId: this.state.sessionId,
        time: formattedTime
      }, 'SintraPrime ONLINE');

    } catch (error) {
      logger.error({ error }, 'Failed to start SintraPrime');
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('SintraPrime shutting down...');
    
    this.heartbeat.stop();
    this.recordEvent('shutdown', {
      uptime: this.getUptime()
    });

    this.isRunning = false;
  }

  async setMode(newMode: SintraMode): Promise<void> {
    const oldMode = this.state.mode;
    this.state.mode = newMode;
    this.voice.setMode(newMode);

    // Voice confirmation of mode change
    await this.voice.announceModeChange(newMode);

    this.recordEvent('mode_change', {
      from: oldMode,
      to: newMode
    });

    logger.info({ oldMode, newMode }, 'Mode changed');
  }

  getMode(): SintraMode {
    return this.state.mode;
  }

  getStatus(): {
    online: boolean;
    mode: SintraMode;
    time: string;
    uptime: string;
    sessionId: string;
    eventCount: number;
    lastHeartbeat: string;
  } {
    return {
      online: this.isRunning,
      mode: this.state.mode,
      time: this.timeTracker.getCurrentTime(),
      uptime: this.getUptime(),
      sessionId: this.state.sessionId,
      eventCount: this.state.eventCount,
      lastHeartbeat: this.heartbeat.getLastHeartbeat() || 'Never'
    };
  }

  getRecentEvents(count: number = 10): SintraEvent[] {
    return this.memory.getRecentEvents(count);
  }

  recordEvent(type: string, data: any): void {
    this.state.eventCount++;
    
    const event: SintraEvent = {
      timestamp: new Date(),
      type,
      data,
      mode: this.state.mode,
      sessionId: this.state.sessionId,
      uptime: this.getUptime()
    };

    this.memory.recordEvent(event);
    
    // Log in DEBUG mode
    if (this.state.mode === SintraMode.DEBUG) {
      logger.debug({ event }, 'Event recorded');
    }
  }

  async handleError(error: Error): Promise<void> {
    logger.error({ error }, 'SintraPrime error');
    
    this.recordEvent('error', {
      message: error.message,
      stack: error.stack
    });

    // Voice announcement for critical errors
    await this.voice.announceError(error.message);
  }

  async handleCriticalError(error: Error): Promise<void> {
    logger.fatal({ error }, 'SintraPrime critical error');
    
    // Write last words
    this.memory.writeLastWords(error);
    
    // Voice announcement
    await this.voice.announceCritical('System failure detected');
    
    this.recordEvent('critical_error', {
      message: error.message,
      stack: error.stack
    });
  }

  private getUptime(): string {
    return this.timeTracker.getUptime();
  }

  private getHeartbeatState() {
    return {
      mode: this.state.mode,
      sessionId: this.state.sessionId,
      uptime: this.getUptime(),
      eventCount: this.state.eventCount
    };
  }

  getSessionId(): string {
    return this.state.sessionId;
  }

  getTimeTracker(): TimeTracker {
    return this.timeTracker;
  }

  isAlive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
let instance: SintraPrime | null = null;

export function getSintraPrime(): SintraPrime {
  if (!instance) {
    instance = new SintraPrime();
  }
  return instance;
}
