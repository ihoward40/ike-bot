// Heartbeat System - Proof of life

import fs from 'fs';
import path from 'path';
import { HeartbeatEntry, SintraMode } from './types';

export class HeartbeatSystem {
  private logPath: string;
  private interval: NodeJS.Timeout | null = null;
  private intervalMs: number = 60000; // 60 seconds

  constructor(logDir?: string) {
    const baseDir = logDir || path.join(process.cwd(), 'logs');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    this.logPath = path.join(baseDir, 'heartbeat.log');
  }

  start(getState: () => { mode: SintraMode; sessionId: string; uptime: string; eventCount: number }): void {
    // Write initial heartbeat
    this.writeHeartbeat(getState());

    // Set up recurring heartbeat
    this.interval = setInterval(() => {
      this.writeHeartbeat(getState());
    }, this.intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private writeHeartbeat(state: { mode: SintraMode; sessionId: string; uptime: string; eventCount: number }): void {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const entry: HeartbeatEntry = {
      timestamp,
      sessionId: state.sessionId,
      mode: state.mode,
      uptime: state.uptime,
      eventCount: state.eventCount
    };

    const logLine = `[SintraPrime] Alive — ${timestamp} | Session: ${state.sessionId} | Mode: ${state.mode} | Uptime: ${state.uptime} | Events: ${state.eventCount}\n`;
    
    fs.appendFileSync(this.logPath, logLine, 'utf8');
    
    // Also write structured JSON for parsing
    const jsonPath = this.logPath.replace('.log', '.json');
    const jsonLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(jsonPath, jsonLine, 'utf8');
  }

  getLastHeartbeat(): string | null {
    if (!fs.existsSync(this.logPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.logPath, 'utf8');
      const lines = content.trim().split('\n');
      return lines[lines.length - 1] || null;
    } catch (error) {
      return null;
    }
  }
}
