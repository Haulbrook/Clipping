/**
 * ErrorHandler - Centralized error handling and reporting
 *
 * Provides a single place to handle errors, display user-friendly messages,
 * and optionally report errors to monitoring services.
 *
 * @example
 * try {
 *   await someOperation();
 * } catch (error) {
 *   errorHandler.handle(error, 'Failed to load data');
 * }
 */

import { AppConstants } from '../constants/AppConstants.js';
import { logger } from './Logger.js';
import { eventBus } from './EventBus.js';

export class ErrorHandler {
  /**
   * @param {EventBus} eventBus - Event bus for error notifications
   * @param {Logger} logger - Logger instance
   */
  constructor(eventBus, logger) {
    this.eventBus = eventBus;
    this.logger = logger.scope('ErrorHandler');

    // Track recent errors to avoid spam
    this.recentErrors = new Map();
    this.errorDedupeWindow = 5000; // 5 seconds

    // Setup global error handlers
    this._setupGlobalHandlers();
  }

  /**
   * Setup global error and promise rejection handlers
   * @private
   */
  _setupGlobalHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handle(event.error, 'Uncaught error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handle(event.reason, 'Unhandled promise rejection');
    });
  }

  /**
   * Handle an error
   * @param {Error|string} error - Error object or message
   * @param {string} [userMessage] - User-friendly message to display
   * @param {Object} [context] - Additional context information
   * @param {boolean} [notify=true] - Whether to show notification to user
   */
  handle(error, userMessage = null, context = {}, notify = true) {
    // Normalize error
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorKey = this._getErrorKey(errorObj);

    // Check if this error was recently handled (dedupe)
    if (this._isRecentError(errorKey)) {
      this.logger.debug('Skipping duplicate error', errorObj);
      return;
    }

    // Mark error as recently handled
    this._markErrorAsRecent(errorKey);

    // Log the error
    this.logger.error(userMessage || errorObj.message, {
      error: errorObj,
      context,
      stack: errorObj.stack,
    });

    // Emit error event
    this.eventBus.emit(AppConstants.EVENTS.APP_ERROR, {
      error: errorObj,
      userMessage,
      context,
    });

    // Show user notification if requested
    if (notify) {
      const message = userMessage || this._getUserFriendlyMessage(errorObj);
      this._notifyUser(message);
    }

    // Report to monitoring service (if configured)
    this._reportError(errorObj, context);
  }

  /**
   * Get a unique key for an error
   * @private
   * @param {Error} error - Error object
   * @returns {string}
   */
  _getErrorKey(error) {
    return `${error.message}|${error.stack?.split('\n')[0] || ''}`;
  }

  /**
   * Check if an error was recently handled
   * @private
   * @param {string} errorKey - Error key
   * @returns {boolean}
   */
  _isRecentError(errorKey) {
    const lastTime = this.recentErrors.get(errorKey);
    if (!lastTime) return false;

    const timeSince = Date.now() - lastTime;
    return timeSince < this.errorDedupeWindow;
  }

  /**
   * Mark an error as recently handled
   * @private
   * @param {string} errorKey - Error key
   */
  _markErrorAsRecent(errorKey) {
    this.recentErrors.set(errorKey, Date.now());

    // Clean up old entries
    if (this.recentErrors.size > 100) {
      const cutoff = Date.now() - this.errorDedupeWindow;
      for (const [key, time] of this.recentErrors.entries()) {
        if (time < cutoff) {
          this.recentErrors.delete(key);
        }
      }
    }
  }

  /**
   * Get a user-friendly error message
   * @private
   * @param {Error} error - Error object
   * @returns {string}
   */
  _getUserFriendlyMessage(error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
      return AppConstants.ERRORS.NETWORK_ERROR;
    }

    // API errors
    if (message.includes('api') || message.includes('service')) {
      return AppConstants.ERRORS.API_UNAVAILABLE;
    }

    // Configuration errors
    if (message.includes('config')) {
      return AppConstants.ERRORS.CONFIG_LOAD_FAILED;
    }

    // Generic error
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Notify user about the error
   * @private
   * @param {string} message - User-friendly message
   */
  _notifyUser(message) {
    this.eventBus.emit(AppConstants.EVENTS.NOTIFICATION_SHOW, {
      type: AppConstants.NOTIFICATION_TYPES.ERROR,
      message,
      duration: 5000,
    });
  }

  /**
   * Report error to monitoring service
   * @private
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  _reportError(error, context) {
    // TODO: Integrate with error monitoring service (e.g., Sentry, Rollbar)
    // For now, just log it
    this.logger.debug('Error reported', { error, context });
  }

  /**
   * Handle API errors specifically
   * @param {Error} error - Error object
   * @param {string} endpoint - API endpoint
   * @param {Object} [params] - Request parameters
   */
  handleApiError(error, endpoint, params = {}) {
    this.handle(error, AppConstants.ERRORS.API_UNAVAILABLE, {
      type: 'api_error',
      endpoint,
      params,
    });
  }

  /**
   * Handle validation errors
   * @param {string} field - Field name
   * @param {string} message - Validation message
   */
  handleValidationError(field, message) {
    const fullMessage = `${field}: ${message}`;
    this.handle(new Error(fullMessage), fullMessage, {
      type: 'validation_error',
      field,
    });
  }

  /**
   * Wrap an async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} [errorMessage] - User-friendly error message
   * @returns {Function} Wrapped function
   */
  wrap(fn, errorMessage = null) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, errorMessage);
        throw error;
      }
    };
  }

  /**
   * Create a try-catch wrapper for synchronous functions
   * @param {Function} fn - Function to wrap
   * @param {string} [errorMessage] - User-friendly error message
   * @returns {Function} Wrapped function
   */
  wrapSync(fn, errorMessage = null) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handle(error, errorMessage);
        throw error;
      }
    };
  }

  /**
   * Assert a condition and throw error if false
   * @param {boolean} condition - Condition to check
   * @param {string} message - Error message
   * @throws {Error}
   */
  assert(condition, message) {
    if (!condition) {
      const error = new Error(message);
      this.handle(error, message);
      throw error;
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler(eventBus, logger);
