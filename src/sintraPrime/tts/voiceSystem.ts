/**
 * Voice System - Platform-agnostic Text-to-Speech
 * Uses PowerShell on Windows, say on macOS, espeak on Linux
 */

import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "../../config/logger";
import { logEvent } from "../core/memory";

const execAsync = promisify(exec);

/**
 * Detect platform
 */
function getPlatform(): "windows" | "macos" | "linux" | "unknown" {
  const platform = process.platform;
  if (platform === "win32") return "windows";
  if (platform === "darwin") return "macos";
  if (platform === "linux") return "linux";
  return "unknown";
}

/**
 * Sanitize text for shell commands to prevent command injection
 */
function sanitizeText(text: string): string {
  // Remove dangerous characters and limit length
  return text
    .replace(/[`$\\]/g, '') // Remove backticks, dollar signs, backslashes
    .replace(/[\n\r]/g, ' ') // Replace newlines with spaces
    .substring(0, 500); // Limit length to prevent abuse
}

/**
 * Generate TTS command based on platform
 */
function getTTSCommand(text: string): string | null {
  const platform = getPlatform();
  
  // Sanitize text to prevent command injection
  const sanitizedText = sanitizeText(text);
  // Escape remaining special characters for shell
  const escapedText = sanitizedText.replace(/["']/g, '');

  switch (platform) {
    case "windows":
      // PowerShell TTS - use single quotes to prevent expansion
      return `powershell -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak('${escapedText}')"`;
    
    case "macos":
      // macOS say command
      return `say "${escapedText}"`;
    
    case "linux":
      // Linux espeak
      return `espeak "${escapedText}"`;
    
    default:
      return null;
  }
}

/**
 * Check if TTS is available on the system
 */
export async function isTTSAvailable(): Promise<boolean> {
  const platform = getPlatform();
  
  try {
    switch (platform) {
      case "windows":
        await execAsync("powershell -Command \"Get-Command Add-Type\"");
        return true;
      
      case "macos":
        await execAsync("which say");
        return true;
      
      case "linux":
        await execAsync("which espeak");
        return true;
      
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Speak text using platform-appropriate TTS
 */
export async function speak(text: string): Promise<void> {
  const platform = getPlatform();
  const command = getTTSCommand(text);

  if (!command) {
    logger.warn({ platform }, "[SintraPrime TTS] Platform not supported");
    logEvent("tts_unsupported_platform", { platform, text });
    return;
  }

  try {
    logger.info({ text, platform }, "[SintraPrime TTS] Speaking...");
    await execAsync(command);
    
    logEvent("tts_spoken", { 
      text, 
      platform,
      success: true 
    });
  } catch (error) {
    logger.error({ error, text, platform }, "[SintraPrime TTS] Failed to speak");
    logEvent("tts_error", { 
      text, 
      platform, 
      error: String(error) 
    }, { severity: "error" });
  }
}

/**
 * Announce system event
 */
export async function announceEvent(eventType: string, message?: string): Promise<void> {
  const announcement = message || `SintraPrime event: ${eventType}`;
  await speak(announcement);
}

/**
 * Get TTS system info
 */
export function getTTSInfo(): {
  platform: string;
  available: boolean;
  engine: string;
} {
  const platform = getPlatform();
  let engine = "none";

  switch (platform) {
    case "windows":
      engine = "PowerShell System.Speech";
      break;
    case "macos":
      engine = "say";
      break;
    case "linux":
      engine = "espeak";
      break;
  }

  return {
    platform,
    available: platform !== "unknown",
    engine
  };
}
