/**
 * APIManager - Handles all API communications and integrations
 *
 * Refactored version with:
 * - Dependency injection instead of window.app
 * - No global fetch override
 * - Proper error handling
 * - Constants instead of magic numbers
 * - Logger instead of console.log
 */

import { AppConstants } from '../constants/AppConstants.js';

export class APIManager {
  /**
   * @param {ConfigService} configService - Configuration service
   * @param {EventBus} eventBus - Event bus
   * @param {Logger} logger - Logger instance
   * @param {ErrorHandler} errorHandler - Error handler
   */
  constructor(configService, eventBus, logger, errorHandler) {
    this.config = configService;
    this.eventBus = eventBus;
    this.logger = logger.scope('APIManager');
    this.errorHandler = errorHandler;

    // Internal state
    this.endpoints = new Map();
    this.cache = new Map();
    this.requestQueue = [];
    this.isOnline = navigator.onLine;

    // Track network events
    this._setupNetworkListeners();
  }

  /**
   * Initialize the API manager
   */
  async init() {
    this._loadEndpoints();
    this.logger.info('APIManager initialized', {
      endpoints: Array.from(this.endpoints.keys()),
      isOnline: this.isOnline,
    });
  }

  /**
   * Setup network event listeners
   * @private
   */
  _setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.logger.info('Network connection restored');
      this.eventBus.emit(AppConstants.EVENTS.API_ONLINE);
      this._processRequestQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.logger.warn('Network connection lost');
      this.eventBus.emit(AppConstants.EVENTS.API_OFFLINE);
    });
  }

  /**
   * Load endpoints from configuration
   * @private
   */
  _loadEndpoints() {
    const services = this.config.get('services', {});

    for (const [key, service] of Object.entries(services)) {
      if (service.url && service.enabled) {
        this.endpoints.set(key, service.url);
        this.logger.debug(`Loaded endpoint: ${key} -> ${service.url}`);
      }
    }
  }

  /**
   * Make a fetch request with enhanced features
   * @private
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>}
   */
  async _fetch(url, options = {}) {
    // Add common headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Dashboard-Version': this.config.get('app.version', '1.0.0'),
      ...options.headers,
    };

    // Setup timeout
    const timeout = this.config.get('api.timeout', AppConstants.TIMEOUTS.API_REQUEST);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions = {
      ...options,
      headers,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * Call a Google Apps Script function
   * @param {string} scriptId - Script identifier (maps to endpoint)
   * @param {string} functionName - Function name to call
   * @param {Array} parameters - Function parameters
   * @returns {Promise<any>}
   */
  async callGoogleScript(scriptId, functionName, parameters = []) {
    const endpoint = this.endpoints.get(scriptId);

    if (!endpoint) {
      const error = new Error(AppConstants.ERRORS.TOOL_NOT_CONFIGURED);
      this.errorHandler.handleApiError(error, scriptId, { functionName });
      throw error;
    }

    const requestData = {
      function: functionName,
      parameters,
      devMode: this.config.get('app.environment') === 'development',
    };

    this.logger.debug(`Calling Google Script: ${scriptId}.${functionName}`, parameters);

    this.eventBus.emit(AppConstants.EVENTS.API_REQUEST_START, {
      scriptId,
      functionName,
      parameters,
    });

    try {
      const response = await this._makeRequest('POST', endpoint, requestData);
      const data = await this._handleGoogleScriptResponse(response);

      this.eventBus.emit(AppConstants.EVENTS.API_REQUEST_SUCCESS, {
        scriptId,
        functionName,
        data,
      });

      return data;
    } catch (error) {
      this.logger.error(`Google Script call failed: ${scriptId}.${functionName}`, error);

      this.eventBus.emit(AppConstants.EVENTS.API_REQUEST_ERROR, {
        scriptId,
        functionName,
        error,
      });

      throw error;
    }
  }

  /**
   * Handle Google Apps Script response
   * @private
   * @param {Response} response - Fetch response
   * @returns {Promise<any>}
   */
  async _handleGoogleScriptResponse(response) {
    const data = await response.json();

    if (!data.success || data.error) {
      throw new Error(data.error?.message || AppConstants.ERRORS.INVALID_RESPONSE);
    }

    return data.response;
  }

  /**
   * Make a generic HTTP request
   * @private
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {any} data - Request data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  async _makeRequest(method, url, data = null, options = {}) {
    const cacheEnabled = this.config.get('api.cacheEnabled', true);
    const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;

    // Check cache for GET requests
    if (method === 'GET' && cacheEnabled && this._hasValidCache(cacheKey)) {
      this.logger.debug('Returning cached response', { cacheKey });
      return this._getCache(cacheKey);
    }

    const request = {
      method,
      url,
      data,
      options,
      cacheKey,
      attempts: 0,
      maxAttempts: this.config.get('api.maxRetries', AppConstants.API.MAX_RETRIES),
    };

    if (!this.isOnline) {
      this.logger.warn('Request queued (offline)', { url });
      this.requestQueue.push(request);
      throw new Error('No internet connection. Request queued for retry.');
    }

    return this._executeRequest(request);
  }

  /**
   * Execute a request with retry logic
   * @private
   * @param {Object} request - Request object
   * @returns {Promise<Response>}
   */
  async _executeRequest(request) {
    const { method, url, data, options, cacheKey } = request;

    const fetchOptions = {
      method,
      ...options,
    };

    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }

    try {
      const response = await this._fetch(url, fetchOptions);

      // Cache successful GET responses
      const cacheEnabled = this.config.get('api.cacheEnabled', true);
      if (method === 'GET' && response.ok && cacheEnabled) {
        this._setCache(cacheKey, response.clone());
      }

      return response;
    } catch (error) {
      return this._handleRequestError(request, error);
    }
  }

  /**
   * Handle request error with retry logic
   * @private
   * @param {Object} request - Request object
   * @param {Error} error - Error object
   * @returns {Promise<Response>}
   */
  async _handleRequestError(request, error) {
    request.attempts++;

    const shouldRetry = this._shouldRetry(error);
    const hasAttemptsLeft = request.attempts < request.maxAttempts;

    if (shouldRetry && hasAttemptsLeft) {
      this.logger.warn(
        `Request failed, retrying (${request.attempts}/${request.maxAttempts})`,
        error.message
      );

      // Exponential backoff
      const baseDelay = AppConstants.TIMEOUTS.RETRY_DELAY_BASE;
      const delay = Math.pow(2, request.attempts - 1) * baseDelay;
      await this._sleep(delay);

      return this._executeRequest(request);
    }

    // All retries exhausted
    this.logger.error('Request failed after all retries', error);
    throw error;
  }

  /**
   * Determine if a request should be retried
   * @private
   * @param {Error} error - Error object
   * @returns {boolean}
   */
  _shouldRetry(error) {
    // Retry on network errors, timeouts, and certain status codes
    return (
      error.name === 'TypeError' || // Network error
      error.message.includes('timeout') ||
      error.message.includes('fetch')
    );
  }

  /**
   * Process queued requests
   * @private
   */
  async _processRequestQueue() {
    if (this.requestQueue.length === 0) return;

    this.logger.info(`Processing ${this.requestQueue.length} queued requests`);

    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requests) {
      try {
        await this._executeRequest(request);
        this.logger.debug('Queued request completed', { url: request.url });
      } catch (error) {
        this.logger.error('Queued request failed', error);
        // Could re-queue or notify user
      }
    }
  }

  // ===== Cache Management =====

  /**
   * Check if cache has valid entry
   * @private
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  _hasValidCache(key) {
    if (!this.cache.has(key)) return false;

    const cached = this.cache.get(key);
    const cacheTTL = this.config.get('api.cacheTTL', AppConstants.TIMEOUTS.CACHE_TTL);
    const isValid = Date.now() - cached.timestamp < cacheTTL;

    if (!isValid) {
      this.cache.delete(key);
    }

    return isValid;
  }

  /**
   * Get cached response
   * @private
   * @param {string} key - Cache key
   * @returns {Response}
   */
  _getCache(key) {
    return this.cache.get(key).response;
  }

  /**
   * Set cache entry
   * @private
   * @param {string} key - Cache key
   * @param {Response} response - Response to cache
   */
  _setCache(key, response) {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.info('API cache cleared');
  }

  // ===== Tool-Specific API Methods =====

  /**
   * Search inventory
   * @param {string} query - Search query
   * @returns {Promise<Object>}
   */
  async searchInventory(query) {
    try {
      return await this.callGoogleScript('inventory', 'askInventory', [query]);
    } catch (error) {
      this.errorHandler.handleApiError(error, 'searchInventory', { query });
      return {
        answer: AppConstants.ERRORS.API_UNAVAILABLE,
        source: 'error',
        success: false,
      };
    }
  }

  /**
   * Update inventory
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  async updateInventory(updateData) {
    return this.callGoogleScript('inventory', 'updateInventory', [updateData]);
  }

  /**
   * Grade product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>}
   */
  async gradeProduct(productData) {
    return this.callGoogleScript('grading', 'gradeProduct', [productData]);
  }

  /**
   * Get schedule
   * @param {string} date - Date string
   * @returns {Promise<Object>}
   */
  async getSchedule(date) {
    return this.callGoogleScript('scheduler', 'getSchedule', [date]);
  }

  /**
   * Update schedule
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>}
   */
  async updateSchedule(scheduleData) {
    return this.callGoogleScript('scheduler', 'updateSchedule', [scheduleData]);
  }

  /**
   * Checkout tool
   * @param {Object} toolData - Tool data
   * @returns {Promise<Object>}
   */
  async checkoutTool(toolData) {
    return this.callGoogleScript('tools', 'checkoutTool', [toolData]);
  }

  /**
   * Return tool
   * @param {Object} toolData - Tool data
   * @returns {Promise<Object>}
   */
  async returnTool(toolData) {
    return this.callGoogleScript('tools', 'returnTool', [toolData]);
  }

  /**
   * Get user info
   * @returns {Promise<Object>}
   */
  async getUserInfo() {
    try {
      return await this.callGoogleScript('auth', 'getUserInfo', []);
    } catch (error) {
      this.logger.warn('Could not get user info, using defaults', error);
      return {
        name: 'Guest User',
        email: 'guest@deeproots.com',
        avatar: '👤',
      };
    }
  }

  /**
   * Check user access
   * @returns {Promise<Object>}
   */
  async checkAccess() {
    try {
      return await this.callGoogleScript('auth', 'checkUserAccess', []);
    } catch (error) {
      this.logger.warn('Access check failed, allowing default access', error);
      return { hasAccess: true, role: 'guest' };
    }
  }

  /**
   * Export data
   * @param {string} type - Data type to export
   * @returns {Promise<Object>}
   */
  async exportData(type) {
    const functionName = `export${type.charAt(0).toUpperCase() + type.slice(1)}CSV`;
    return this.callGoogleScript('inventory', functionName, []);
  }

  /**
   * Create backup
   * @returns {Promise<Object>}
   */
  async createBackup() {
    return this.callGoogleScript('inventory', 'createDataBackup', []);
  }

  /**
   * Generate report
   * @returns {Promise<Object>}
   */
  async generateReport() {
    return this.callGoogleScript('inventory', 'generateComprehensiveReport', []);
  }

  /**
   * Health check for all endpoints
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    const results = {};

    for (const [name, endpoint] of this.endpoints.entries()) {
      try {
        const start = Date.now();
        await fetch(endpoint, {
          method: 'HEAD',
          timeout: 5000,
        });
        results[name] = {
          status: 'healthy',
          responseTime: Date.now() - start,
        };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message,
        };
      }
    }

    return results;
  }

  /**
   * Get API statistics
   * @returns {Object}
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      queueLength: this.requestQueue.length,
      isOnline: this.isOnline,
      endpoints: Array.from(this.endpoints.keys()),
    };
  }

  // ===== Utility Methods =====

  /**
   * Sleep utility
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
