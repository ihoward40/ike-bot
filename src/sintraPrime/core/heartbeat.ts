/**
 * Heartbeat - File-based proof-of-life system
 * Updates heartbeat.log every 60 seconds
 */

import fs from "fs";
import path from "path";
import { formatESTTimestamp, getESTISOString } from "./timeTracker";
import { logger } from "../../config/logger";

const HEARTBEAT_INTERVAL = 60000; // 60 seconds
const HEARTBEAT_LOG_PATH = path.join(process.cwd(), "logs", "heartbeat.log");

let heartbeatTimer: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Write heartbeat to file
 */
function writeHeartbeat(): void {
  const timestamp = formatESTTimestamp();
  const isoTimestamp = getESTISOString();
  const heartbeatData = {
    timestamp,
    isoTimestamp,
    status: "alive",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  };

  const logLine = `${timestamp} | Status: ${heartbeatData.status} | Uptime: ${Math.floor(heartbeatData.uptime)}s | PID: ${heartbeatData.pid}\n`;

  try {
    // Ensure logs directory exists
    const logsDir = path.dirname(HEARTBEAT_LOG_PATH);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Append to heartbeat log
    fs.appendFileSync(HEARTBEAT_LOG_PATH, logLine);

    logger.debug({
      ...heartbeatData,
      file: HEARTBEAT_LOG_PATH
    }, "[SintraPrime Heartbeat] Updated");
  } catch (error) {
    logger.error({ error }, "[SintraPrime Heartbeat] Failed to write");
  }
}

/**
 * Start heartbeat monitoring
 */
export function startHeartbeat(): void {
  if (isRunning) {
    logger.warn("[SintraPrime Heartbeat] Already running");
    return;
  }

  isRunning = true;
  logger.info("[SintraPrime Heartbeat] Starting...");

  // Write initial heartbeat
  writeHeartbeat();

  // Set up recurring heartbeat
  heartbeatTimer = setInterval(() => {
    writeHeartbeat();
  }, HEARTBEAT_INTERVAL);

  logger.info({
    interval: HEARTBEAT_INTERVAL,
    path: HEARTBEAT_LOG_PATH
  }, "[SintraPrime Heartbeat] Active");
}

/**
 * Stop heartbeat monitoring
 */
export function stopHeartbeat(): void {
  if (!isRunning) {
    return;
  }

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  isRunning = false;
  logger.info("[SintraPrime Heartbeat] Stopped");
}

/**
 * Check if heartbeat is running
 */
export function isHeartbeatRunning(): boolean {
  return isRunning;
}
