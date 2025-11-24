/**
 * Simple logger utility for consistent logging across the application
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    // Use appropriate console method based on log level
    const logMethod = level === LogLevel.ERROR ? console.error : 
                     level === LogLevel.WARN ? console.warn : 
                     console.log;

    if (data) {
      logMethod(logMessage, data);
    } else {
      logMethod(logMessage);
    }
  }

  error(message: string, error?: any) {
    this.log(LogLevel.ERROR, message, error);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }
}

export default new Logger();
