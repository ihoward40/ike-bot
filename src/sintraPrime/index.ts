/**
 * SintraPrime - Monitoring and Automation System with Agent Mode
 * Main export module
 */

// Core monitoring system
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

// Agent mode subsystems
export {
  agentCore,
  intentRouter,
  planningEngine,
  toolAuthority,
  stateMachine,
  contextMemory
} from "./agent";

export type {
  AgentResult,
  Intent,
  IntentType,
  ExecutionPlan,
  ExecutionStep,
  StepStatus,
  ToolResult,
  ToolCapability,
  Task,
  TaskState,
  ContextEntry,
  UserContext
} from "./agent";
