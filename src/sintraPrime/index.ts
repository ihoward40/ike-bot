/**
 * SintraPrime - Monitoring and Automation System
 * Main export module
 */

export {
  activate,
  deactivate,
  getStatus,
  isActivated,
  startHeartbeat,
  stopHeartbeat,
  isHeartbeatRunning,
  logEvent,
  readEvents,
  listMemoryLogs,
  initializeMemory,
  getESTTime,
  formatESTTimestamp,
  getESTISOString,
  logTimeEvent,
  speak,
  isTTSAvailable,
  getTTSInfo,
  announceEvent
} from "./core";

export type { MemoryEvent } from "./core/memory";
