/**
 * Application Constants
 * Central location for all magic numbers, strings, and configuration values
 */

export const AppConstants = {
  // Timeouts (in milliseconds)
  TIMEOUTS: {
    API_REQUEST: 30000,        // 30 seconds
    DASHBOARD_UPDATE: 30000,   // 30 seconds
    CACHE_TTL: 300000,         // 5 minutes
    RETRY_DELAY_BASE: 2000,    // Base delay for exponential backoff
  },

  // API Configuration
  API: {
    MAX_RETRIES: 3,
    RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  },

  // Chat Configuration
  CHAT: {
    KEYWORD_MATCH_SCORE_EXACT: 2,
    KEYWORD_MATCH_SCORE_PARTIAL: 1,
    MIN_ROUTE_SCORE: 2,
    MAX_HISTORY_SIZE: 100,
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    DASHBOARD_SETTINGS: 'dashboardSettings',
    CHAT_HISTORY: 'chatHistory',
    USER_PREFERENCES: 'userPreferences',
    THEME: 'theme',
    CONFIG_OVERRIDE: 'configOverride',
    LAST_TOOL: 'lastTool',
    SIDEBAR_STATE: 'sidebarState',
  },

  // View IDs
  VIEWS: {
    DASHBOARD: 'dashboardView',
    CHAT: 'chatInterface',
    TOOL_CONTAINER: 'toolContainer',
    SETTINGS: 'settingsModal',
  },

  // Button IDs
  BUTTONS: {
    DASHBOARD: 'dashboardBtn',
    NEW_CHAT: 'newChatBtn',
    SETTINGS: 'settingsBtn',
    THEME_TOGGLE: 'themeToggle',
    SIDEBAR_TOGGLE: 'sidebarToggle',
  },

  // Tool IDs
  TOOLS: {
    INVENTORY: 'inventory',
    GRADING: 'grading',
    SCHEDULER: 'scheduler',
    CHECKOUT: 'tools',
  },

  // Events
  EVENTS: {
    // App Lifecycle
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',

    // Configuration
    CONFIG_LOADED: 'config:loaded',
    CONFIG_UPDATED: 'config:updated',
    CONFIG_ERROR: 'config:error',

    // Navigation
    VIEW_CHANGED: 'view:changed',
    TOOL_OPENED: 'tool:opened',
    TOOL_CLOSED: 'tool:closed',
    TOOL_READY: 'tool:ready',

    // API
    API_REQUEST_START: 'api:request:start',
    API_REQUEST_SUCCESS: 'api:request:success',
    API_REQUEST_ERROR: 'api:request:error',
    API_OFFLINE: 'api:offline',
    API_ONLINE: 'api:online',

    // Chat
    CHAT_MESSAGE_SENT: 'chat:message:sent',
    CHAT_MESSAGE_RECEIVED: 'chat:message:received',
    CHAT_TOOL_ROUTED: 'chat:tool:routed',

    // UI
    THEME_CHANGED: 'ui:theme:changed',
    SIDEBAR_TOGGLED: 'ui:sidebar:toggled',
    NOTIFICATION_SHOW: 'ui:notification:show',

    // Dashboard
    METRICS_UPDATED: 'dashboard:metrics:updated',
    ACTIVITY_UPDATED: 'dashboard:activity:updated',
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },

  // Log Levels
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  },

  // Themes
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
  },

  // Error Messages
  ERRORS: {
    CONFIG_LOAD_FAILED: 'Failed to load configuration',
    API_UNAVAILABLE: 'API service is currently unavailable',
    TOOL_LOAD_FAILED: 'Failed to load tool',
    NETWORK_ERROR: 'Network connection error',
    INVALID_RESPONSE: 'Invalid response from server',
    UNAUTHORIZED: 'Unauthorized access',
    TOOL_NOT_CONFIGURED: 'Tool is not properly configured',
    INVALID_MESSAGE: 'Invalid message format',
  },

  // Success Messages
  SUCCESS: {
    CONFIG_LOADED: 'Configuration loaded successfully',
    TOOL_OPENED: 'Tool loaded successfully',
    SETTINGS_SAVED: 'Settings saved successfully',
  },

  // Iframe Message Types
  MESSAGE_TYPES: {
    TOOL_READY: 'tool_ready',
    TOOL_ERROR: 'tool_error',
    TOOL_DATA: 'tool_data',
    TOOL_REQUEST: 'tool_request',
    TOOL_RESIZE: 'tool_resize',
  },

  // Allowed Origins for iframe communication
  ALLOWED_ORIGINS: [
    'https://script.google.com',
    'https://script.googleusercontent.com',
  ],

  // Development Mode
  DEV: {
    ENABLE_DEBUG_LOGS: false, // Set to true for development
    MOCK_API: false,
  },
};

// Freeze the constants to prevent modification
Object.freeze(AppConstants);
Object.freeze(AppConstants.TIMEOUTS);
Object.freeze(AppConstants.API);
Object.freeze(AppConstants.CHAT);
Object.freeze(AppConstants.STORAGE_KEYS);
Object.freeze(AppConstants.VIEWS);
Object.freeze(AppConstants.BUTTONS);
Object.freeze(AppConstants.TOOLS);
Object.freeze(AppConstants.EVENTS);
Object.freeze(AppConstants.NOTIFICATION_TYPES);
Object.freeze(AppConstants.LOG_LEVELS);
Object.freeze(AppConstants.THEMES);
Object.freeze(AppConstants.ERRORS);
Object.freeze(AppConstants.SUCCESS);
Object.freeze(AppConstants.MESSAGE_TYPES);
Object.freeze(AppConstants.ALLOWED_ORIGINS);
Object.freeze(AppConstants.DEV);
