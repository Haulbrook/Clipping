/**
 * Bootstrap - Application initialization and dependency injection setup
 *
 * This file wires up all dependencies and initializes the application.
 * Replaces the global window.app pattern with proper dependency injection.
 */

import { container } from './core/DIContainer.js';
import { EventBus, eventBus } from './core/EventBus.js';
import { Logger, logger } from './core/Logger.js';
import { ConfigService } from './core/ConfigService.js';
import { ErrorHandler, errorHandler } from './core/ErrorHandler.js';
import { AppConstants } from './constants/AppConstants.js';

// Import managers (we'll keep using the original ones for now, gradually refactoring)
// For now, we'll create thin wrappers that make them work with DI
import { APIManager } from './managers/APIManager.js';

/**
 * Bootstrap the application
 * @returns {Promise<Object>} Application instance with all managers
 */
export async function bootstrap() {
  try {
    logger.info('Bootstrapping application...');

    // ===== Register Core Services =====
    container.registerInstance('eventBus', eventBus);
    container.registerInstance('logger', logger);
    container.registerInstance('errorHandler', errorHandler);

    // Register ConfigService
    container.register('configService', ConfigService, ['eventBus', 'logger']);

    // ===== Load Configuration =====
    const configService = container.get('configService');
    await configService.load();

    // Validate configuration
    const validation = configService.validate();
    if (!validation.valid) {
      logger.warn('Configuration validation issues:', validation.errors);
      // Show warnings to user but continue
      eventBus.emit(AppConstants.EVENTS.NOTIFICATION_SHOW, {
        type: AppConstants.NOTIFICATION_TYPES.WARNING,
        message: 'Some services are not configured. Please check settings.',
        duration: 5000,
      });
    }

    // ===== Register Managers =====
    container.register('apiManager', APIManager, [
      'configService',
      'eventBus',
      'logger',
      'errorHandler',
    ]);

    // For now, we'll create adapters for the old managers
    // These will be refactored later
    container.registerFactory('uiManager', () => {
      return createUIManagerAdapter();
    });

    container.registerFactory('chatManager', () => {
      return createChatManagerAdapter();
    });

    container.registerFactory('toolManager', () => {
      return createToolManagerAdapter();
    });

    container.registerFactory('dashboardManager', () => {
      return createDashboardManagerAdapter();
    });

    // ===== Initialize API Manager =====
    const apiManager = container.get('apiManager');
    await apiManager.init();

    // ===== Create Application Instance =====
    const app = {
      // Core services
      config: configService,
      eventBus,
      logger,
      errorHandler,
      container,

      // Managers
      api: apiManager,
      ui: container.get('uiManager'),
      chat: container.get('chatManager'),
      tools: container.get('toolManager'),
      dashboard: container.get('dashboardManager'),

      // Public methods
      getService: (name) => container.get(name),
      hasService: (name) => container.has(name),
    };

    // ===== Setup Global Error Handler =====
    setupGlobalErrorHandling(app);

    // ===== Setup Event Listeners =====
    setupApplicationEvents(app);

    // Emit app ready event
    eventBus.emit(AppConstants.EVENTS.APP_READY, app);
    logger.info('Application bootstrapped successfully');

    return app;
  } catch (error) {
    logger.error('Failed to bootstrap application', error);
    errorHandler.handle(error, 'Failed to start application');
    throw error;
  }
}

/**
 * Create UI Manager adapter (temporary until full refactor)
 */
function createUIManagerAdapter() {
  const config = container.get('configService');
  const eventBus = container.get('eventBus');
  const logger = container.get('logger').scope('UIManager');

  // Create instance of old UIManager if it exists
  if (typeof UIManager !== 'undefined') {
    const uiManager = new UIManager();

    // Add event bus integration
    uiManager.emit = (event, data) => eventBus.emit(event, data);
    uiManager.on = (event, handler) => eventBus.on(event, handler);
    uiManager.logger = logger;
    uiManager.config = config;

    return uiManager;
  }

  // Fallback minimal implementation
  return {
    init: () => {},
    showMessage: (message, type) => {
      eventBus.emit(AppConstants.EVENTS.NOTIFICATION_SHOW, {
        type: type || AppConstants.NOTIFICATION_TYPES.INFO,
        message,
      });
    },
    showError: (message) => {
      eventBus.emit(AppConstants.EVENTS.NOTIFICATION_SHOW, {
        type: AppConstants.NOTIFICATION_TYPES.ERROR,
        message,
      });
    },
  };
}

/**
 * Create Chat Manager adapter (temporary until full refactor)
 */
function createChatManagerAdapter() {
  const api = container.get('apiManager');
  const config = container.get('configService');
  const eventBus = container.get('eventBus');
  const logger = container.get('logger').scope('ChatManager');

  if (typeof ChatManager !== 'undefined') {
    const chatManager = new ChatManager();

    // Inject dependencies
    chatManager.api = api;
    chatManager.config = config;
    chatManager.eventBus = eventBus;
    chatManager.logger = logger;
    chatManager.emit = (event, data) => eventBus.emit(event, data);

    return chatManager;
  }

  return {
    init: () => {},
    sendMessage: () => {},
  };
}

/**
 * Create Tool Manager adapter (temporary until full refactor)
 */
function createToolManagerAdapter() {
  const config = container.get('configService');
  const eventBus = container.get('eventBus');
  const logger = container.get('logger').scope('ToolManager');

  if (typeof ToolManager !== 'undefined') {
    const toolManager = new ToolManager();

    // Inject dependencies
    toolManager.config = config;
    toolManager.eventBus = eventBus;
    toolManager.logger = logger;

    return toolManager;
  }

  return {
    init: () => {},
  };
}

/**
 * Create Dashboard Manager adapter (temporary until full refactor)
 */
function createDashboardManagerAdapter() {
  const api = container.get('apiManager');
  const config = container.get('configService');
  const eventBus = container.get('eventBus');
  const logger = container.get('logger').scope('DashboardManager');

  if (typeof DashboardManager !== 'undefined') {
    const dashboardManager = new DashboardManager();

    // Inject dependencies
    dashboardManager.api = api;
    dashboardManager.config = config;
    dashboardManager.eventBus = eventBus;
    dashboardManager.logger = logger;

    return dashboardManager;
  }

  return {
    init: () => {},
  };
}

/**
 * Setup global error handling
 */
function setupGlobalErrorHandling(app) {
  // Error handler is already set up in ErrorHandler constructor
  // Just log that it's active
  app.logger.debug('Global error handling enabled');
}

/**
 * Setup application-level event listeners
 */
function setupApplicationEvents(app) {
  const { eventBus, logger } = app;

  // Listen for configuration changes
  eventBus.on(AppConstants.EVENTS.CONFIG_UPDATED, (data) => {
    logger.debug('Configuration updated', data);
  });

  // Listen for API status changes
  eventBus.on(AppConstants.EVENTS.API_OFFLINE, () => {
    logger.warn('API is offline');
    eventBus.emit(AppConstants.EVENTS.NOTIFICATION_SHOW, {
      type: AppConstants.NOTIFICATION_TYPES.WARNING,
      message: 'You are currently offline. Some features may be limited.',
      duration: 5000,
    });
  });

  eventBus.on(AppConstants.EVENTS.API_ONLINE, () => {
    logger.info('API is back online');
    eventBus.emit(AppConstants.EVENTS.NOTIFICATION_SHOW, {
      type: AppConstants.NOTIFICATION_TYPES.SUCCESS,
      message: 'Connection restored.',
      duration: 3000,
    });
  });

  // Listen for notifications and display them
  eventBus.on(AppConstants.EVENTS.NOTIFICATION_SHOW, (data) => {
    showNotification(data.message, data.type, data.duration);
  });
}

/**
 * Show a notification to the user
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {number} duration - Duration in ms
 */
function showNotification(message, type = 'info', duration = 5000) {
  // Get UI manager to handle actual display
  const uiManager = container.get('uiManager');

  if (uiManager && typeof uiManager.showNotification === 'function') {
    uiManager.showNotification(message, type, duration);
  } else {
    // Fallback to simple alert if UI manager not available
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

/**
 * Initialize legacy managers
 * This is called after DOM is ready to initialize the old-style managers
 */
export function initializeLegacyManagers(app) {
  const { ui, chat, tools, dashboard, logger } = app;

  logger.info('Initializing legacy managers...');

  // Initialize each manager if it has an init method
  if (ui && typeof ui.init === 'function') {
    try {
      ui.init();
      logger.debug('UI Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize UI Manager', error);
    }
  }

  if (chat && typeof chat.init === 'function') {
    try {
      chat.init();
      logger.debug('Chat Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize Chat Manager', error);
    }
  }

  if (tools && typeof tools.init === 'function') {
    try {
      tools.init();
      logger.debug('Tool Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize Tool Manager', error);
    }
  }

  if (dashboard && typeof dashboard.init === 'function') {
    try {
      dashboard.init().catch(error => {
        logger.warn('Dashboard Manager init failed', error);
      });
      logger.debug('Dashboard Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize Dashboard Manager', error);
    }
  }
}
