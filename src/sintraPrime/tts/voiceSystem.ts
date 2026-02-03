// Voice/TTS System - Platform agnostic

import { exec } from 'child_process';
import { promisify } from 'util';
import { SintraMode } from '../core/types';

const execAsync = promisify(exec);

export class VoiceSystem {
  private enabled: boolean = true;
  private currentMode: SintraMode = SintraMode.SENTINEL;

  setMode(mode: SintraMode): void {
    this.currentMode = mode;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async speak(message: string, force: boolean = false): Promise<void> {
    // Don't speak in QUIET mode unless forced
    if (this.currentMode === SintraMode.QUIET && !force) {
      return;
    }

    if (!this.enabled) {
      return;
    }

    try {
      await this.platformSpeak(message);
    } catch (error) {
      console.error('TTS Error:', error);
      // Don't throw - TTS failure shouldn't crash the system
    }
  }

  private async platformSpeak(message: string): Promise<void> {
    const platform = process.platform;

    if (platform === 'win32') {
      // Windows - PowerShell
      const escapedMessage = message.replace(/"/g, '`"');
      const command = `powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${escapedMessage}')"`;
      await execAsync(command);
    } else if (platform === 'darwin') {
      // macOS - say command
      const escapedMessage = message.replace(/'/g, "'\\''");
      await execAsync(`say '${escapedMessage}'`);
    } else if (platform === 'linux') {
      // Linux - try espeak, festival, or spd-say
      const escapedMessage = message.replace(/'/g, "'\\''");
      
      // Try espeak first (most common)
      try {
        await execAsync(`espeak '${escapedMessage}'`);
      } catch {
        try {
          // Try spd-say (speech-dispatcher)
          await execAsync(`spd-say '${escapedMessage}'`);
        } catch {
          // Fallback: just log it
          console.log(`[TTS] ${message}`);
        }
      }
    } else {
      // Unknown platform - just log
      console.log(`[TTS] ${message}`);
    }
  }

  async announceStartup(time: string): Promise<void> {
    const message = `SintraPrime online. Time is ${time}. All systems standing by.`;
    await this.speak(message, true);
  }

  async announceModeChange(newMode: SintraMode): Promise<void> {
    const message = `Mode changed to ${newMode}.`;
    await this.speak(message);
  }

  async announceError(errorMessage: string): Promise<void> {
    const message = `Error: ${errorMessage}`;
    await this.speak(message, true);
  }

  async announceCritical(message: string): Promise<void> {
    await this.speak(`Critical alert: ${message}`, true);
  }
}
