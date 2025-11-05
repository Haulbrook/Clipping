/**
 * 🚀 Deep Roots Dashboard - Main Application Controller
 * Initializes and orchestrates all dashboard functionality
 */

class DashboardApp {
    constructor() {
        this.isInitialized = false;
        this.currentTool = null;
        this.config = null;
        this.user = null;

        // Initialize core components
        this.ui = new UIManager();
        this.chat = new ChatManager();
        this.tools = new ToolManager();
        this.api = new APIManager();
        this.dashboard = null; // Will be initialized after config loads

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Dashboard App...');
            
            // Show loading screen
            this.showLoadingScreen(true);
            
            // Load configuration
            await this.loadConfiguration();

            // Initialize API manager with loaded config
            this.api.init();
            console.log('✅ API Manager initialized with endpoints:', this.api.endpoints);

            // Initialize user session
            await this.initializeUser();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize UI components
            this.ui.init();
            this.chat.init();
            this.tools.init();

            // Initialize dashboard manager if DashboardManager exists (non-blocking)
            if (typeof DashboardManager !== 'undefined') {
                this.dashboard = new DashboardManager();
                // Initialize dashboard in background - don't block app startup
                this.dashboard.init().then(() => {
                    console.log('✅ Dashboard Manager initialized');
                }).catch(error => {
                    console.warn('⚠️ Dashboard Manager failed to initialize:', error);
                    // App still works without dashboard metrics
                });
            }

            // Hide loading screen and show app
            setTimeout(() => {
                this.showLoadingScreen(false);
                this.isInitialized = true;
                console.log('✅ Dashboard App initialized successfully');
            }, 1500);
            
        } catch (error) {
            console.error('❌ Failed to initialize Dashboard App:', error);
            this.handleInitializationError(error);
        }
    }

    async loadConfiguration() {
        try {
            // Load from config.json
            const response = await fetch('config.json');
            this.config = await response.json();
            
            // Merge with localStorage settings
            const savedSettings = localStorage.getItem('dashboardSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.config = { ...this.config, ...settings };
            }
            
            // Update tool URLs from settings
            this.updateToolURLs();
            
        } catch (error) {
            console.warn('⚠️ Using default configuration:', error);
            this.config = this.getDefaultConfig();
        }
    }

    updateToolURLs() {
        const savedUrls = {
            inventory: localStorage.getItem('inventoryUrl'),
            grading: localStorage.getItem('gradingUrl'),
            scheduler: localStorage.getItem('schedulerUrl'),
            tools: localStorage.getItem('toolsUrl')
        };

        Object.entries(savedUrls).forEach(([key, url]) => {
            if (url && this.config.services[key]) {
                this.config.services[key].url = url;
            }
        });
    }

    async initializeUser() {
        try {
            // Try to get user info from Google Apps Script or mock for development
            this.user = await this.getUserInfo();
            this.ui.updateUserInfo(this.user);
        } catch (error) {
            console.warn('⚠️ Using guest user:', error);
            this.user = {
                name: 'Guest User',
                email: 'guest@deeproots.com',
                avatar: '👤'
            };
            this.ui.updateUserInfo(this.user);
        }
    }

    async getUserInfo() {
        // In production, this would call Google Apps Script
        // For development, return mock data
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    name: 'Deep Roots User',
                    email: 'user@deeprootslandscape.com',
                    avatar: '🌱'
                });
            }, 500);
        });
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');

        // Sidebar navigation - Dashboard view button (if exists) or new chat
        const dashboardBtn = document.getElementById('dashboardBtn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => {
                console.log('Dashboard button clicked');
                this.showDashboardView();
            });
            console.log('✅ Dashboard button listener attached');
        }

        const chatBtn = document.getElementById('chatBtn');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                console.log('Chat button clicked');
                this.showChatInterface();
            });
            console.log('✅ Chat button listener attached');
        }

        // Tool navigation
        const toolButtons = document.querySelectorAll('.tool-item');
        console.log(`Found ${toolButtons.length} tool buttons`);

        toolButtons.forEach((btn, index) => {
            const toolId = btn.dataset.tool;
            console.log(`  Tool button ${index}: ${toolId}`);

            btn.addEventListener('click', (e) => {
                console.log(`Tool button clicked: ${toolId}`);
                this.openTool(toolId);
            });
        });

        console.log('✅ All tool listeners attached');

        // Disable unconfigured tools (but event listeners are already attached)
        this.updateToolButtonStates();

        // Settings
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.ui.showSettingsModal();
        });

        // Mobile menu
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            this.ui.toggleSidebar();
        });

        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            this.ui.toggleSidebar();
        });

        // Tool controls
        document.getElementById('toolBackBtn')?.addEventListener('click', () => {
            this.showDashboardView();
        });

        document.getElementById('toolRefreshBtn')?.addEventListener('click', () => {
            this.refreshCurrentTool();
        });

        document.getElementById('toolFullscreenBtn')?.addEventListener('click', () => {
            this.toggleToolFullscreen();
        });

        // Settings modal
        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('cancelSettings')?.addEventListener('click', () => {
            this.ui.hideSettingsModal();
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.currentTarget.dataset.query;
                if (query) {
                    this.chat.sendMessage(query);
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window events
        window.addEventListener('online', () => {
            this.ui.updateConnectionStatus(true);
        });

        window.addEventListener('offline', () => {
            this.ui.updateConnectionStatus(false);
        });
    }

    updateToolButtonStates() {
        // Check which tools are configured and style them accordingly
        if (!this.config?.services) {
            console.warn('Config not loaded yet, skipping tool state update');
            return;
        }

        console.log('🔍 Updating tool button states...');

        document.querySelectorAll('.tool-item').forEach(btn => {
            const toolId = btn.dataset.tool;
            const tool = this.config.services[toolId];

            const isConfigured = tool && tool.url && tool.url !== '' && !tool.url.includes('YOUR_') && !tool.url.includes('_HERE');

            if (!isConfigured) {
                // Tool not configured - style as disabled but DON'T use btn.disabled
                btn.classList.add('tool-disabled');
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = 'Tool not configured yet';
                console.log(`  ❌ ${toolId}: Not configured`);
            } else {
                // Tool configured - enable fully
                btn.classList.remove('tool-disabled');
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.title = tool.description || tool.name;
                console.log(`  ✅ ${toolId}: ${tool.url.substring(0, 50)}...`);
            }
        });
    }

    showDashboardView() {
        this.currentTool = null;
        document.getElementById('dashboardView')?.classList.remove('hidden');
        document.getElementById('chatInterface')?.classList.add('hidden');
        document.getElementById('toolContainer')?.classList.add('hidden');

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById('dashboardBtn')?.classList.add('active');

        // Update header
        document.getElementById('pageTitle').textContent = 'Operations Dashboard';
        document.getElementById('pageSubtitle').textContent = 'Overview of inventory, fleet, and recent activity';

        // Refresh dashboard if available
        if (this.dashboard) {
            this.dashboard.loadMetrics();
            this.dashboard.renderMetricsCards();
            this.dashboard.loadRecentActivity();
            this.dashboard.renderRecentActivity();
        }
    }

    showChatInterface() {
        console.log('💬 Showing chat interface');
        this.currentTool = null;
        document.getElementById('dashboardView')?.classList.add('hidden');
        document.getElementById('chatInterface')?.classList.remove('hidden');
        document.getElementById('toolContainer')?.classList.add('hidden');

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById('newChatBtn')?.classList.add('active');

        // Update header
        document.getElementById('pageTitle').textContent = 'Operations Dashboard';
        document.getElementById('pageSubtitle').textContent = 'What can I help you with today?';

        // Focus chat input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            setTimeout(() => chatInput.focus(), 100);
        }
        console.log('✅ Chat interface shown');
    }

    async openTool(toolId) {
        console.log(`🔧 Opening tool: ${toolId}`);

        const tool = this.config.services[toolId];
        if (!tool) {
            console.error('❌ Tool not found:', toolId);
            return;
        }

        if (!tool.url || tool.url === '' || tool.url.includes('YOUR_') || tool.url.includes('_HERE')) {
            console.error(`❌ Tool ${toolId} not configured`);
            alert('Tool not configured. Please set the URL in settings.');
            return;
        }

        console.log(`✅ Tool ${toolId} configured, loading: ${tool.url.substring(0, 50)}...`);

        this.currentTool = toolId;

        // Update UI
        document.getElementById('dashboardView')?.classList.add('hidden');
        document.getElementById('chatInterface')?.classList.add('hidden');
        document.getElementById('toolContainer')?.classList.remove('hidden');
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tool="${toolId}"]`).classList.add('active');
        
        // Update header and tool info
        document.getElementById('pageTitle').textContent = tool.name;
        document.getElementById('pageSubtitle').textContent = tool.description;
        document.getElementById('toolIcon').textContent = tool.icon;
        document.getElementById('toolTitle').textContent = tool.name;
        document.getElementById('toolDescription').textContent = tool.description;
        
        // Load tool in iframe
        this.loadToolInIframe(tool.url);
    }

    loadToolInIframe(url) {
        const iframe = document.getElementById('toolIframe');
        const loading = document.querySelector('.tool-loading');
        
        // Show loading
        loading.style.display = 'flex';
        
        // Set up iframe load handler
        const onLoad = () => {
            loading.style.display = 'none';
            iframe.removeEventListener('load', onLoad);
        };
        
        iframe.addEventListener('load', onLoad);
        
        // Handle load errors
        const onError = () => {
            loading.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <p>Failed to load tool</p>
                    <button onclick="window.app.refreshCurrentTool()" class="btn btn-primary" style="margin-top: 1rem;">
                        Try Again
                    </button>
                </div>
            `;
        };
        
        iframe.addEventListener('error', onError);
        
        // Load the URL
        iframe.src = url;
        
        // Add timeout fallback
        setTimeout(() => {
            if (loading.style.display !== 'none') {
                onError();
            }
        }, 10000);
    }

    refreshCurrentTool() {
        if (this.currentTool) {
            const tool = this.config.services[this.currentTool];
            if (tool && tool.url) {
                this.loadToolInIframe(tool.url);
            }
        }
    }

    toggleToolFullscreen() {
        const container = document.getElementById('toolContainer');
        if (container.requestFullscreen) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                container.requestFullscreen();
            }
        }
    }

    saveSettings() {
        const settings = {
            services: {
                inventory: { url: document.getElementById('inventoryUrl').value },
                grading: { url: document.getElementById('gradingUrl').value },
                scheduler: { url: document.getElementById('schedulerUrl').value },
                tools: { url: document.getElementById('toolsUrl').value }
            },
            darkMode: document.getElementById('darkMode').checked
        };

        // Save to localStorage
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
        localStorage.setItem('inventoryUrl', settings.services.inventory.url);
        localStorage.setItem('gradingUrl', settings.services.grading.url);
        localStorage.setItem('schedulerUrl', settings.services.scheduler.url);
        localStorage.setItem('toolsUrl', settings.services.tools.url);

        // Apply dark mode
        if (settings.darkMode) {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }

        // Update config
        Object.assign(this.config.services, settings.services);

        this.ui.hideSettingsModal();
        this.ui.showMessage('Settings saved successfully!', 'success');
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + /: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            document.getElementById('chatInput')?.focus();
        }
        
        // Escape: Close modals or go back
        if (e.key === 'Escape') {
            if (!document.querySelector('.modal.hidden')) {
                this.ui.hideAllModals();
            } else if (this.currentTool) {
                this.showChatInterface();
            }
        }
    }

    showLoadingScreen(show) {
        const loading = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        if (show) {
            loading.style.display = 'flex';
            app.classList.add('hidden');
        } else {
            loading.style.display = 'none';
            app.classList.remove('hidden');
        }
    }

    handleInitializationError(error) {
        const loading = document.getElementById('loadingScreen');
        loading.innerHTML = `
            <div class="loading-content" style="color: white; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h2>Failed to Load Dashboard</h2>
                <p style="margin: 1rem 0;">${error.message || 'Unknown error occurred'}</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: var(--primary-color);
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    Reload Page
                </button>
            </div>
        `;
    }

    getDefaultConfig() {
        return {
            app: {
                name: "Deep Roots Operations Dashboard",
                version: "1.0.0"
            },
            services: {
                inventory: { name: "Inventory Management", icon: "🌱", url: "", color: "#4CAF50" },
                grading: { name: "Grade & Sell", icon: "⭐", url: "", color: "#FF9800" },
                scheduler: { name: "Scheduler", icon: "📅", url: "", color: "#2196F3" },
                tools: { name: "Tool Checkout", icon: "🔧", url: "", color: "#9C27B0" }
            },
            ai: {
                enabled: true,
                fallbackMessage: "I can help you with inventory, grading, scheduling, or tool checkout. What would you like to do?"
            }
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DashboardApp();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardApp;
}