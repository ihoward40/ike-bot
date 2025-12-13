// CLI Commands for SintraPrime

import { getSintraPrime } from '../core/sintraPrime';
import { SintraMode } from '../core/types';

export class SintraCLI {
  
  static handleCommand(command: string, args: string[]): string {
    const sintra = getSintraPrime();

    switch (command.toLowerCase()) {
      case 'status':
        return this.getStatus(sintra);
      
      case 'mode':
        if (args.length === 0) {
          return `Current mode: ${sintra.getMode()}`;
        }
        return this.setMode(sintra, args[0]);
      
      case 'events':
        const count = args.length > 0 ? parseInt(args[0]) : 10;
        return this.getEvents(sintra, count);
      
      case 'help':
        return this.getHelp();
      
      default:
        return `Unknown command: ${command}\nType 'sintra help' for available commands.`;
    }
  }

  private static getStatus(sintra: any): string {
    const status = sintra.getStatus();
    return `
SintraPrime ${status.online ? 'ONLINE' : 'OFFLINE'}
Mode: ${status.mode}
Time: ${status.time}
Uptime: ${status.uptime}
Session: ${status.sessionId}
Events: ${status.eventCount}
Last Heartbeat: ${status.lastHeartbeat}
`.trim();
  }

  private static setMode(sintra: any, modeStr: string): string {
    const modeUpper = modeStr.toUpperCase();
    
    if (!Object.values(SintraMode).includes(modeUpper as SintraMode)) {
      return `Invalid mode: ${modeStr}\nAvailable modes: ${Object.values(SintraMode).join(', ')}`;
    }

    sintra.setMode(modeUpper as SintraMode);
    return `Mode set to ${modeUpper}`;
  }

  private static getEvents(sintra: any, count: number): string {
    const events = sintra.getRecentEvents(count);
    
    if (events.length === 0) {
      return 'No events recorded yet.';
    }

    let output = `Last ${events.length} events:\n\n`;
    
    events.forEach((event: any, index: number) => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      output += `${index + 1}. [${time}] ${event.type} (${event.mode})\n`;
      output += `   Data: ${JSON.stringify(event.data)}\n`;
    });

    return output.trim();
  }

  private static getHelp(): string {
    return `
SintraPrime CLI Commands:

  status              Show current status and uptime
  mode [MODE]         Get or set current mode
                      Modes: SENTINEL, DISPATCH, FOCUS, QUIET, DEBUG
  events [COUNT]      Show recent events (default: 10)
  help                Show this help message

Examples:
  sintra status
  sintra mode sentinel
  sintra events 20
`.trim();
  }
}
