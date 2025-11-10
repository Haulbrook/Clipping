/**
 * Logger - Centralized logging system with level-based filtering
 *
 * Replaces scattered console.log statements with a proper logging framework
 * that supports different log levels and can be easily disabled in production.
 *
 * @example
 * logger.debug('Detailed debug info', { data });
 * logger.info('Info message');
 * logger.warn('Warning message');
 * logger.error('Error occurred', error);
 */

import { AppConstants } from '../constants/AppConstants.js';

export class Logger {
  /**
   * @param {number} [level=LOG_LEVELS.INFO] - Minimum log level to display
   */
  constructor(level = AppConstants.LOG_LEVELS.INFO) {
    this.level = level;
    this.prefix = '🌲 Deep Roots';
  }

  /**
   * Set the current log level
   * @param {number} level - One of AppConstants.LOG_LEVELS
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Format a log message with timestamp and level
   * @private
   * @param {string} levelName - Level name for display
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   * @returns {Array}
   */
  _format(levelName, message, ...args) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return [`[${timestamp}] ${this.prefix} [${levelName}]`, message, ...args];
  }

  /**
   * Log debug message (lowest priority)
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  debug(message, ...args) {
    if (this.level >= AppConstants.LOG_LEVELS.DEBUG) {
      console.log(...this._format('DEBUG', message, ...args));
    }
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    if (this.level >= AppConstants.LOG_LEVELS.INFO) {
      console.info(...this._format('INFO', message, ...args));
    }
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  warn(message, ...args) {
    if (this.level >= AppConstants.LOG_LEVELS.WARN) {
      console.warn(...this._format('WARN', message, ...args));
    }
  }

  /**
   * Log error message (highest priority)
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    if (this.level >= AppConstants.LOG_LEVELS.ERROR) {
      console.error(...this._format('ERROR', message, ...args));
    }
  }

  /**
   * Create a scoped logger with a specific prefix
   * @param {string} scope - Scope name (e.g., 'APIManager', 'ChatManager')
   * @returns {Logger}
   */
  scope(scope) {
    const scopedLogger = new Logger(this.level);
    scopedLogger.prefix = `${this.prefix} [${scope}]`;
    return scopedLogger;
  }

  /**
   * Group related log messages
   * @param {string} label - Group label
   * @param {Function} fn - Function containing grouped logs
   */
  group(label, fn) {
    if (this.level >= AppConstants.LOG_LEVELS.DEBUG) {
      console.group(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    } else {
      fn();
    }
  }

  /**
   * Log execution time of a function
   * @param {string} label - Label for the timer
   * @param {Function} fn - Function to time
   * @returns {Promise<any>} Result of the function
   */
  async time(label, fn) {
    const startLabel = `${label} - start`;
    const endLabel = `${label} - end`;

    if (this.level >= AppConstants.LOG_LEVELS.DEBUG) {
      console.time(label);
      this.debug(startLabel);
    }

    try {
      const result = await fn();

      if (this.level >= AppConstants.LOG_LEVELS.DEBUG) {
        this.debug(endLabel);
        console.timeEnd(label);
      }

      return result;
    } catch (error) {
      if (this.level >= AppConstants.LOG_LEVELS.DEBUG) {
        console.timeEnd(label);
      }
      throw error;
    }
  }

  /**
   * Log a table (useful for structured data)
   * @param {any} data - Data to display in table format
   */
  table(data) {
    if (this.level >= AppConstants.LOG_LEVELS.DEBUG) {
      console.table(data);
    }
  }
}

// Export singleton instance with default level
// In production, set to ERROR level
const defaultLevel = AppConstants.DEV.ENABLE_DEBUG_LOGS
  ? AppConstants.LOG_LEVELS.DEBUG
  : AppConstants.LOG_LEVELS.ERROR;

export const logger = new Logger(defaultLevel);
