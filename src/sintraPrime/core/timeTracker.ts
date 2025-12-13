// Time Awareness System

export class TimeTracker {
  private startTime: Date;
  private timezone: string;

  constructor() {
    this.startTime = new Date();
    this.timezone = 'EST'; // Default to EST as specified
  }

  getStartTime(): Date {
    return this.startTime;
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  getFormattedTime(): string {
    const now = new Date();
    return now.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getUptime(): string {
    const now = new Date();
    const uptimeMs = now.getTime() - this.startTime.getTime();
    
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }

  getTimezone(): string {
    return this.timezone;
  }
}
