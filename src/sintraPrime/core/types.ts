// SintraPrime Core Types

export enum SintraMode {
  SENTINEL = 'SENTINEL',   // monitoring, watching, logging
  DISPATCH = 'DISPATCH',   // sending notices, emails, automations
  FOCUS = 'FOCUS',         // no chatter, only critical alerts
  QUIET = 'QUIET',         // logs only, no voice
  DEBUG = 'DEBUG'          // verbose, explains itself
}

export interface SintraState {
  mode: SintraMode;
  startTime: Date;
  sessionId: string;
  timezone: string;
  lastHeartbeat: Date;
  eventCount: number;
}

export interface SintraEvent {
  timestamp: Date;
  type: string;
  data: any;
  mode: SintraMode;
  sessionId: string;
  uptime: string;
}

export interface HeartbeatEntry {
  timestamp: string;
  sessionId: string;
  mode: SintraMode;
  uptime: string;
  eventCount: number;
}
