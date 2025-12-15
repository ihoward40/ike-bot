/**
 * Time Tracker - EST timezone management for SintraPrime
 */

import { logger } from "../../config/logger";

// Use EST (America/New_York) timezone for all timestamps
const TIMEZONE = "America/New_York";

/**
 * Get current time in EST
 */
export function getESTTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }));
}

/**
 * Format timestamp in EST
 */
export function formatESTTimestamp(date?: Date): string {
  const d = date || getESTTime();
  return d.toLocaleString("en-US", { 
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

/**
 * Get ISO timestamp in EST
 */
export function getESTISOString(): string {
  const est = getESTTime();
  return est.toISOString();
}

/**
 * Log time-based event
 */
export function logTimeEvent(eventName: string, data?: any): void {
  const timestamp = formatESTTimestamp();
  logger.info({
    event: eventName,
    timestamp,
    timezone: TIMEZONE,
    ...data
  }, `[SintraPrime Time] ${eventName}`);
}
