/**
 * 로깅 유틸리티
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

function getCurrentLogLevel(): number {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  return LOG_LEVELS[level] ?? LOG_LEVELS.info;
}

function formatLog(level: LogLevel, message: string, data?: Record<string, unknown>): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...(data && { data })
  });
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>): void {
    if (getCurrentLogLevel() <= LOG_LEVELS.debug) {
      console.debug(formatLog('debug', message, data));
    }
  },

  info(message: string, data?: Record<string, unknown>): void {
    if (getCurrentLogLevel() <= LOG_LEVELS.info) {
      console.info(formatLog('info', message, data));
    }
  },

  warn(message: string, data?: Record<string, unknown>): void {
    if (getCurrentLogLevel() <= LOG_LEVELS.warn) {
      console.warn(formatLog('warn', message, data));
    }
  },

  error(message: string, data?: Record<string, unknown>): void {
    if (getCurrentLogLevel() <= LOG_LEVELS.error) {
      console.error(formatLog('error', message, data));
    }
  }
};
