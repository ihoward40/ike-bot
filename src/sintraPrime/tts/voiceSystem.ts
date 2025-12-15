/**
 * Voice System - Platform-agnostic Text-to-Speech
 * Uses PowerShell on Windows, say on macOS, espeak on Linux
 */

import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "../../config/logger";
import { logEvent } from "../core/memory";

const execAsync = promisify(exec);

const AVAILABILITY_CACHE_MS = 30_000;
let cachedAvailability: { value: boolean; checkedAt: number } | null = null;

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
    .replace(/[`$\\]/g, "") // Remove backticks, dollar signs, backslashes
    .replace(/[\n\r]/g, " ") // Replace newlines with spaces
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
  const escapedText = sanitizedText.replace(/["']/g, "");

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
  const now = Date.now();
  if (cachedAvailability && now - cachedAvailability.checkedAt < AVAILABILITY_CACHE_MS) {
    return cachedAvailability.value;
  }

  const platform = getPlatform();
  let available = false;

  try {
    switch (platform) {
      case "windows":
        await execAsync('powershell -Command "Get-Command Add-Type"');
        available = true;
        break;

      case "macos":
        await execAsync("which say");
        available = true;
        break;

      case "linux":
        await execAsync("which espeak");
        available = true;
        break;

      default:
        available = false;
    }
  } catch {
    available = false;
  }

  cachedAvailability = { value: available, checkedAt: now };
  return available;
}

/**
 * Speak text using platform-appropriate TTS
 */
export async function speak(text: string): Promise<void> {
  const platform = getPlatform();

  const available = await isTTSAvailable();
  if (!available) {
    logger.debug({ platform }, "[SintraPrime TTS] Not available (skipping audio)");
    return;
  }

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
    logEvent(
      "tts_error",
      {
        text,
        platform,
        error: String(error)
      },
      { severity: "error" }
    );
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
  supported: boolean;
  available: boolean;
  availabilityKnown: boolean;
  lastCheckedAt?: number;
  engine: string;
} {
  const platform = getPlatform();
  const supported = platform !== "unknown";
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
    supported,
    availabilityKnown:
      !!cachedAvailability && Date.now() - cachedAvailability.checkedAt < AVAILABILITY_CACHE_MS,
    available:
      !!cachedAvailability && Date.now() - cachedAvailability.checkedAt < AVAILABILITY_CACHE_MS
        ? cachedAvailability.value
        : false,
    lastCheckedAt: cachedAvailability?.checkedAt,
    engine
  };
}
