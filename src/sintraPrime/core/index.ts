/**
 * SintraPrime Core - Main orchestrator for monitoring and automation
 */

import { logger } from "../../config/logger";
import { startHeartbeat, stopHeartbeat, isHeartbeatRunning } from "./heartbeat";
import { initializeMemory, logEvent } from "./memory";
import { logTimeEvent } from "./timeTracker";
import { speak, isTTSAvailable, getTTSInfo } from "../tts/voiceSystem";
import { agentCore } from "../agent/agentCore";

let isActive = false;

/**
 * Activate SintraPrime system with agent mode
 */
export async function activate(): Promise<void> {
  if (isActive) {
    logger.warn("[SintraPrime] Already active");
    return;
  }

  try {
    logger.info("[SintraPrime] Activating with Agent Mode...");

    // Initialize memory system
    initializeMemory();

    // Start heartbeat
    startHeartbeat();

    // Log activation event
    logTimeEvent("sintraprime_activated");
    logEvent("activation", {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      agentMode: true
    });

    // Check TTS availability
    const ttsInfo = getTTSInfo();
    const ttsAvailable = await isTTSAvailable();
    
    logger.info({ 
      tts: { ...ttsInfo, available: ttsAvailable } 
    }, "[SintraPrime] TTS system checked");

    logEvent("tts_check", { ...ttsInfo, available: ttsAvailable });

    // Start agent mode periodic checks
    agentCore.startPeriodicCheck(60000); // Check every minute
    logger.info("[SintraPrime] Agent mode periodic checks started");

    // Announce activation if TTS is available
    if (ttsAvailable) {
      await speak("SintraPrime agent mode is now active");
    }

    isActive = true;
    logger.info("[SintraPrime] ✓ ACTIVE (Agent Mode)");

  } catch (error) {
    logger.error({ error }, "[SintraPrime] Activation failed");
    logEvent("activation_failed", { 
      error: String(error) 
    }, { severity: "error" });
    throw error;
  }
}

/**
 * Deactivate SintraPrime system
 */
export async function deactivate(): Promise<void> {
  if (!isActive) {
    logger.warn("[SintraPrime] Not active");
    return;
  }

  try {
    logger.info("[SintraPrime] Deactivating...");

    // Stop agent mode periodic checks
    agentCore.stopPeriodicCheck();
    logger.info("[SintraPrime] Agent mode periodic checks stopped");

    // Log deactivation
    logTimeEvent("sintraprime_deactivated");
    logEvent("deactivation", {
      uptime: process.uptime()
    });

    // Announce deactivation if TTS is available
    const ttsAvailable = await isTTSAvailable();
    if (ttsAvailable) {
      await speak("SintraPrime agent mode is shutting down");
    }

    // Stop heartbeat
    stopHeartbeat();

    isActive = false;
    logger.info("[SintraPrime] Deactivated");

  } catch (error) {
    logger.error({ error }, "[SintraPrime] Deactivation failed");
    throw error;
  }
}

/**
 * Get SintraPrime status
 */
export function getStatus(): {
  active: boolean;
  heartbeat: boolean;
  uptime: number;
  pid: number;
} {
  return {
    active: isActive,
    heartbeat: isHeartbeatRunning(),
    uptime: process.uptime(),
    pid: process.pid
  };
}

/**
 * Check if SintraPrime is active
 */
export function isActivated(): boolean {
  return isActive;
}

// Export sub-modules
export * from "./heartbeat";
export * from "./memory";
export * from "./timeTracker";
export { speak, isTTSAvailable, getTTSInfo, announceEvent } from "../tts/voiceSystem";
