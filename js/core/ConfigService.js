/**
 * ConfigService - Centralized configuration management
 *
 * Single source of truth for all application configuration.
 * Replaces the configuration sprawl across multiple sources.
 *
 * @example
 * // Get a config value
 * const apiUrl = configService.get('services.inventory.url');
 *
 * // Set a config value
 * configService.set('theme', 'dark');
 *
 * // Check if a feature is enabled
 * if (configService.isFeatureEnabled('offlineMode')) { ... }
 */

import { AppConstants } from '../constants/AppConstants.js';
import { logger } from './Logger.js';
import { eventBus } from './EventBus.js';

export class ConfigService {
  /**
   * @param {EventBus} eventBus - Event bus for emitting config changes
   * @param {Logger} logger - Logger instance
   */
  constructor(eventBus, logger) {
    this.eventBus = eventBus;
    this.logger = logger.scope('ConfigService');

    /** @private Configuration data */
    this.config = {};

    /** @private Default configuration */
    this.defaults = this._getDefaults();

    /** @private Flag to track if config is loaded */
    this.loaded = false;
  }

  /**
   * Get default configuration
   * @private
   * @returns {Object}
   */
  _getDefaults() {
    return {
      app: {
        name: 'Deep Roots Operations Dashboard',
        version: '1.0.0',
        environment: this._detectEnvironment(),
      },
      services: {
        inventory: { url: '', enabled: true },
        grading: { url: '', enabled: true },
        scheduler: { url: '', enabled: true },
        tools: { url: '', enabled: true },
      },
      features: {
        offlineMode: true,
        chatHistory: true,
        autoRefresh: true,
        notifications: true,
      },
      ui: {
        theme: AppConstants.THEMES.LIGHT,
        sidebarOpen: true,
        defaultView: 'dashboard',
      },
      api: {
        timeout: AppConstants.TIMEOUTS.API_REQUEST,
        maxRetries: AppConstants.API.MAX_RETRIES,
        cacheEnabled: true,
        cacheTTL: AppConstants.TIMEOUTS.CACHE_TTL,
      },
    };
  }

  /**
   * Detect the current environment
   * @private
   * @returns {string} 'development' | 'production'
   */
  _detectEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
      return 'development';
    }
    return 'production';
  }

  /**
   * Load configuration from config.json
   * @returns {Promise<void>}
   */
  async load() {
    try {
      this.logger.info('Loading configuration...');

      // Start with defaults
      this.config = this._deepClone(this.defaults);

      // Load from config.json
      try {
        const response = await fetch('config.json');
        if (response.ok) {
          const fileConfig = await response.json();
          this._deepMerge(this.config, fileConfig);
          this.logger.info('Loaded configuration from config.json');
        }
      } catch (error) {
        this.logger.warn('Could not load config.json, using defaults', error);
      }

      // Load user preferences from localStorage
      this._loadFromStorage();

      // Apply URL parameter overrides (for debugging)
      this._applyUrlOverrides();

      this.loaded = true;
      this.eventBus.emit(AppConstants.EVENTS.CONFIG_LOADED, this.config);
      this.logger.info('Configuration loaded successfully');

    } catch (error) {
      this.logger.error('Failed to load configuration', error);
      this.eventBus.emit(AppConstants.EVENTS.CONFIG_ERROR, error);
      throw error;
    }
  }

  /**
   * Load user preferences from localStorage
   * @private
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(AppConstants.STORAGE_KEYS.DASHBOARD_SETTINGS);
      if (stored) {
        const userPrefs = JSON.parse(stored);
        this._deepMerge(this.config, userPrefs);
        this.logger.debug('Loaded user preferences from localStorage');
      }
    } catch (error) {
      this.logger.warn('Failed to load user preferences', error);
    }
  }

  /**
   * Apply URL parameter overrides
   * @private
   */
  _applyUrlOverrides() {
    const params = new URLSearchParams(window.location.search);

    // Debug mode
    if (params.has('debug')) {
      this.set('app.debug', true);
      this.logger.debug('Debug mode enabled via URL parameter');
    }

    // Theme override
    if (params.has('theme')) {
      const theme = params.get('theme');
      if (Object.values(AppConstants.THEMES).includes(theme)) {
        this.set('ui.theme', theme);
      }
    }
  }

  /**
   * Get a configuration value by path
   * @param {string} path - Dot-notation path (e.g., 'services.inventory.url')
   * @param {any} [defaultValue] - Default value if path not found
   * @returns {any}
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set a configuration value by path
   * @param {string} path - Dot-notation path
   * @param {any} value - Value to set
   * @param {boolean} [persist=true] - Whether to persist to localStorage
   */
  set(path, value, persist = true) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.config;

    // Navigate to the parent object
    for (const key of keys) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    // Set the value
    const oldValue = target[lastKey];
    target[lastKey] = value;

    // Persist to localStorage if requested
    if (persist) {
      this._saveToStorage();
    }

    // Emit change event
    this.eventBus.emit(AppConstants.EVENTS.CONFIG_UPDATED, {
      path,
      oldValue,
      newValue: value,
    });

    this.logger.debug(`Config updated: ${path} = ${JSON.stringify(value)}`);
  }

  /**
   * Save current configuration to localStorage
   * @private
   */
  _saveToStorage() {
    try {
      // Only save user-modifiable settings
      const userSettings = {
        ui: this.config.ui,
        features: this.config.features,
      };
      localStorage.setItem(
        AppConstants.STORAGE_KEYS.DASHBOARD_SETTINGS,
        JSON.stringify(userSettings)
      );
    } catch (error) {
      this.logger.warn('Failed to save configuration to localStorage', error);
    }
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Feature name
   * @returns {boolean}
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false) === true;
  }

  /**
   * Get service URL
   * @param {string} serviceName - Service name (e.g., 'inventory')
   * @returns {string|null}
   */
  getServiceUrl(serviceName) {
    return this.get(`services.${serviceName}.url`, null);
  }

  /**
   * Set service URL
   * @param {string} serviceName - Service name
   * @param {string} url - Service URL
   */
  setServiceUrl(serviceName, url) {
    this.set(`services.${serviceName}.url`, url);
  }

  /**
   * Validate configuration
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Check that required services have URLs
    const services = this.get('services', {});
    for (const [name, config] of Object.entries(services)) {
      if (config.enabled && (!config.url || config.url.includes('YOUR_') || config.url.includes('_HERE'))) {
        errors.push(`Service "${name}" is enabled but URL is not configured`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export configuration as JSON
   * @returns {string}
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   * @param {string} json - JSON string
   * @throws {Error} If JSON is invalid
   */
  import(json) {
    const imported = JSON.parse(json);
    this._deepMerge(this.config, imported);
    this._saveToStorage();
    this.eventBus.emit(AppConstants.EVENTS.CONFIG_UPDATED, this.config);
  }

  /**
   * Reset configuration to defaults
   */
  reset() {
    this.config = this._deepClone(this.defaults);
    this._saveToStorage();
    this.eventBus.emit(AppConstants.EVENTS.CONFIG_UPDATED, this.config);
  }

  /**
   * Deep clone an object
   * @private
   * @param {any} obj - Object to clone
   * @returns {any}
   */
  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this._deepClone(item));

    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this._deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * Deep merge source into target
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   */
  _deepMerge(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {};
          }
          this._deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  /**
   * Get the entire configuration object
   * @returns {Object}
   */
  getAll() {
    return this._deepClone(this.config);
  }

  /**
   * Check if configuration is loaded
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }
}
