/**
 * Memory - Event logging system with JSON Lines format and daily rotation
 * Logs events in memory/ directory with daily rotation
 */

import fs from "fs";
import path from "path";
import { formatESTTimestamp, getESTTime } from "./timeTracker";
import { logger } from "../../config/logger";

const MEMORY_DIR = path.join(process.cwd(), "memory");

/**
 * Event structure for memory logging
 */
export interface MemoryEvent {
  timestamp: string;
  eventType: string;
  eventData: any;
  source?: string;
  severity?: "info" | "warn" | "error";
}

/**
 * Get current memory log file path (daily rotation)
 */
function getMemoryLogPath(): string {
  const date = getESTTime();
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return path.join(MEMORY_DIR, `events_${dateStr}.jsonl`);
}

/**
 * Ensure memory directory exists
 */
function ensureMemoryDir(): void {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

/**
 * Log event to memory (JSON Lines format)
 */
export function logEvent(
  eventType: string,
  eventData: any,
  options?: {
    source?: string;
    severity?: "info" | "warn" | "error";
  }
): void {
  try {
    ensureMemoryDir();

    const event: MemoryEvent = {
      timestamp: formatESTTimestamp(),
      eventType,
      eventData,
      source: options?.source || "sintraPrime",
      severity: options?.severity || "info"
    };

    const logPath = getMemoryLogPath();
    const eventLine = JSON.stringify(event) + "\n";

    // Append to log file (one event per line - JSON Lines format)
    fs.appendFileSync(logPath, eventLine);

    logger.debug({
      eventType,
      file: logPath
    }, "[SintraPrime Memory] Event logged");
  } catch (error) {
    logger.error({ error, eventType }, "[SintraPrime Memory] Failed to log event");
  }
}

/**
 * Read events from memory log
 */
export function readEvents(date?: Date): MemoryEvent[] {
  try {
    const targetDate = date || getESTTime();
    const dateStr = targetDate.toISOString().split("T")[0];
    const logPath = path.join(MEMORY_DIR, `events_${dateStr}.jsonl`);

    if (!fs.existsSync(logPath)) {
      return [];
    }

    const content = fs.readFileSync(logPath, "utf-8");
    const lines = content.trim().split("\n").filter((line: string) => line);
    
    return lines.map((line: string) => {
      try {
        return JSON.parse(line) as MemoryEvent;
      } catch {
        return null;
      }
    }).filter((event: MemoryEvent | null): event is MemoryEvent => event !== null);
  } catch (error) {
    logger.error({ error, date }, "[SintraPrime Memory] Failed to read events");
    return [];
  }
}

/**
 * Get all memory log files
 */
export function listMemoryLogs(): string[] {
  try {
    ensureMemoryDir();
    const files = fs.readdirSync(MEMORY_DIR);
    return files.filter((f: string) => f.startsWith("events_") && f.endsWith(".jsonl"));
  } catch (error) {
    logger.error({ error }, "[SintraPrime Memory] Failed to list logs");
    return [];
  }
}

/**
 * Initialize memory system
 */
export function initializeMemory(): void {
  ensureMemoryDir();
  logEvent("memory_initialized", {
    memoryDir: MEMORY_DIR,
    pid: process.pid
  });
  logger.info({ memoryDir: MEMORY_DIR }, "[SintraPrime Memory] Initialized");
}
