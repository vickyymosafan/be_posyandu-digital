/**
 * Logger Utility untuk Sistem Backend Posyandu Lansia
 * 
 * Menggunakan Winston untuk structured logging dengan support untuk:
 * - Multiple log levels (error, warn, info, debug)
 * - Environment-specific formatting (development vs production)
 * - Structured logging dengan context/metadata
 * - Timezone-aware timestamps
 * 
 * Usage:
 * ```typescript
 * import logger from './utils/logger';
 * 
 * logger.info('User logged in', { userId: 1, email: 'user@example.com' });
 * logger.error('Database connection failed', { error: err.message });
 * ```
 */

import winston from 'winston';

/**
 * Type definition untuk log context/metadata
 * Memungkinkan passing data tambahan ke log entries
 */
export interface LogContext {
  [key: string]: any;
}

/**
 * Get log level dari environment variable atau default
 * Priority: LOG_LEVEL env var > default based on NODE_ENV
 */
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  // Default log levels berdasarkan environment
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info';
    case 'test':
      return 'error';
    case 'development':
    default:
      return 'debug';
  }
};

/**
 * Get timezone dari environment variable atau default
 */
const getTimezone = (): string => {
  return process.env.TIMEZONE || 'Asia/Jakarta';
};

/**
 * Format timestamp dengan timezone yang sesuai
 */
const timestampFormat = winston.format((info) => {
  const timezone = getTimezone();
  info.timestamp = new Date().toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return info;
});

/**
 * Format untuk development environment
 * Output yang colorized dan human-readable
 */
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  timestampFormat(),
  winston.format.printf(({ timestamp, level, message, ...context }) => {
    // Format base message
    let log = `${timestamp} [${level}]: ${message}`;

    // Tambahkan context jika ada
    const contextKeys = Object.keys(context);
    if (contextKeys.length > 0) {
      // Filter out winston internal fields
      const filteredContext = Object.keys(context)
        .filter((key) => !['level', 'message', 'timestamp'].includes(key))
        .reduce((obj, key) => {
          obj[key] = context[key];
          return obj;
        }, {} as LogContext);

      if (Object.keys(filteredContext).length > 0) {
        log += `\n  Context: ${JSON.stringify(filteredContext, null, 2)}`;
      }
    }

    return log;
  })
);

/**
 * Format untuk production environment
 * Output dalam JSON format untuk easy parsing
 */
const productionFormat = winston.format.combine(
  timestampFormat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...context }) => {
    // Filter out winston internal fields
    const filteredContext = Object.keys(context)
      .filter((key) => !['level', 'message', 'timestamp'].includes(key))
      .reduce((obj, key) => {
        obj[key] = context[key];
        return obj;
      }, {} as LogContext);

    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(Object.keys(filteredContext).length > 0 && { context: filteredContext }),
    });
  })
);

/**
 * Determine format berdasarkan environment
 */
const getFormat = (): winston.Logform.Format => {
  return process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat;
};

/**
 * Configure transports berdasarkan environment
 */
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport untuk semua environment
  transports.push(
    new winston.transports.Console({
      // Silent di test environment untuk clean test output
      silent: process.env.NODE_ENV === 'test',
    })
  );

  // File transports untuk production
  if (process.env.NODE_ENV === 'production') {
    // Error log file - hanya error level
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Combined log file - semua levels
    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return transports;
};

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: getLogLevel(),
  format: getFormat(),
  transports: getTransports(),
  // Prevent winston from exiting on error
  exitOnError: false,
});

/**
 * Helper function untuk log dengan context
 * Memudahkan passing metadata ke log entries
 */
export const logWithContext = (
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  context?: LogContext
) => {
  logger.log(level, message, context || {});
};

/**
 * Export logger instance sebagai default export
 * 
 * Usage:
 * ```typescript
 * import logger from './utils/logger';
 * 
 * logger.info('Server started', { port: 3000 });
 * logger.error('Database error', { error: err.message, query: 'SELECT * FROM users' });
 * logger.warn('Rate limit exceeded', { ip: '192.168.1.1', attempts: 6 });
 * logger.debug('Processing request', { method: 'POST', path: '/api/login' });
 * ```
 */
export default logger;
