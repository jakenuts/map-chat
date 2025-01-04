// Logging utilities for consistent log formatting across the application

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogType = 'send' | 'receive' | 'error' | 'map_command';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  type: LogType;
  data: any;
}

class Logger {
  private static instance: Logger;
  private logFile: string[] = [];
  private isVerbose: boolean = false;
  
  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setVerbose(verbose: boolean) {
    this.isVerbose = verbose;
  }

  private formatLogEntry(entry: LogEntry): string {
    return `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.type.toUpperCase()}: ${JSON.stringify(entry.data)}`;
  }

  private log(level: LogLevel, type: LogType, data: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      type,
      data
    };

    // Always add to log file
    this.logFile.push(this.formatLogEntry(entry));

    // Console output based on verbosity and level
    if (this.isVerbose || level === 'error' || level === 'warn') {
      if (level === 'error') {
        console.error(this.formatLogEntry(entry));
      } else if (level === 'warn') {
        console.warn(this.formatLogEntry(entry));
      } else if (this.isVerbose) {
        console.log(this.formatLogEntry(entry));
      }
    }
  }

  debug(type: LogType, data: any) {
    this.log('debug', type, data);
  }

  info(type: LogType, data: any) {
    this.log('info', type, data);
  }

  warn(type: LogType, data: any) {
    this.log('warn', type, data);
  }

  error(type: LogType, data: any) {
    this.log('error', type, data);
  }

  // Map command specific logging
  logMapCommand(command: any, success: boolean, error?: any) {
    if (success) {
      this.debug('map_command', { command });
    } else {
      this.error('map_command', {
        command,
        error: error?.message || 'Unknown error'
      });
    }
  }

  // Get full logs for debugging
  getLogs(): string {
    return this.logFile.join('\n');
  }

  // Save logs to file
  async saveLogs(filename: string = 'map-chat.log'): Promise<void> {
    try {
      const blob = new Blob([this.logFile.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  // Clear logs
  clearLogs() {
    this.logFile = [];
  }
}

// Export singleton instance
const logger = Logger.getInstance();

// Export convenience methods
export const logMessage = (type: LogType, data: any) => {
  logger.info(type, data);
};

export const logMapCommand = (command: any, success: boolean, error?: any) => {
  logger.logMapCommand(command, success, error);
};

// Export logger instance for advanced usage
export default logger;
