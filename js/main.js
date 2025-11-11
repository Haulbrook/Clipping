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

        // Initialize setup wizard (if available)
        this.setupWizard = window.SetupWizard ? new SetupWizard() : null;

        // Skills (will be initialized after configuration)
        this.deconstructionSkill = null;
        this.forwardThinkerSkill = null;

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

            // Run setup wizard if needed
            if (this.setupWizard) {
                const wizardConfig = await this.setupWizard.start();
                if (wizardConfig) {
                    // Merge wizard config with app config
                    this.config = { ...this.config, ...wizardConfig };
                    console.log('✅ Setup wizard completed', wizardConfig);
                }
            }

            // Initialize skills with configuration
            await this.initializeSkills();

            // Initialize user session
            await this.initializeUser();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize UI components
            this.ui.init();
            this.chat.init();
            this.tools.init();

            // Initialize skills in chat manager
            if (this.chat && this.chat.initializeSkills) {
                this.chat.initializeSkills(this.config);
                console.log('✅ Chat skills initialized');
            }

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

            // Start proactive suggestions (if forward thinker is enabled)
            this.startProactiveSuggestions();

            // Hide loading screen and show app
            setTimeout(() => {
                this.showLoadingScreen(false);
                this.isInitialized = true;
                console.log('✅ Dashboard App initialized successfully');
                this.showWelcomeMessage();
            }, 1500);

        } catch (error) {
            console.error('❌ Failed to initialize Dashboard App:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize AI skills (Deconstruction & Forward Thinker)
     */
    async initializeSkills() {
        try {
            // Check if skills are enabled in config
            const enableDeconstruction = this.config.enableDeconstructionSkill !== false;
            const enableForwardThinker = this.config.enableForwardThinkerSkill !== false;

            if (enableDeconstruction && window.DeconstructionRebuildSkill) {
                this.deconstructionSkill = new DeconstructionRebuildSkill(this.config);
                console.log('✅ Deconstruction & Rebuild Skill initialized');
            }

            if (enableForwardThinker && window.ForwardThinkerSkill) {
                this.forwardThinkerSkill = new ForwardThinkerSkill(this.config);
                console.log('✅ Forward Thinker Skill initialized');
            }
        } catch (error) {
            console.warn('⚠️ Skills initialization failed:', error);
        }
    }

    /**
     * Start proactive suggestions system
     */
    startProactiveSuggestions() {
        if (!this.forwardThinkerSkill || !this.config.enableForwardThinkerSkill) {
            return;
        }

        // Generate proactive suggestions every 5 minutes
        setInterval(() => {
            const currentState = {
                lowInventory: false, // Would check real inventory status
                upcomingDeadlines: false // Would check real deadlines
            };

            const suggestions = this.forwardThinkerSkill.generateProactiveSuggestions(currentState);

            if (suggestions.success && suggestions.suggestions.length > 0) {
                this.showProactiveSuggestions(suggestions.suggestions);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Show proactive suggestions to user
     */
    showProactiveSuggestions(suggestions) {
        // Check if suggestions panel already exists
        let panel = document.getElementById('proactive-suggestions-panel');

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'proactive-suggestions-panel';
            panel.className = 'proactive-suggestions';
            document.body.appendChild(panel);
        }

        // Build suggestions HTML
        let html = `
            <div class="suggestions-header">
                <div class="suggestions-title">💡 Suggestions</div>
                <button class="suggestions-close" onclick="this.closest('.proactive-suggestions').remove()">×</button>
            </div>
        `;

        suggestions.slice(0, 3).forEach(suggestion => {
            html += `
                <div class="suggestion-item ${suggestion.priority}-priority" onclick="window.app.handleSuggestionClick('${suggestion.type}')">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-description">${suggestion.description}</div>
                </div>
            `;
        });

        panel.innerHTML = html;

        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (panel && panel.parentNode) {
                panel.remove();
            }
        }, 15000);
    }

    /**
     * Handle suggestion click
     */
    handleSuggestionClick(type) {
        console.log('Suggestion clicked:', type);
        // Route to appropriate tool or action based on suggestion type
    }

    /**
     * Show welcome message with skills info
     */
    showWelcomeMessage() {
        if (!this.chat) return;

        const skillsEnabled = [];
        if (this.deconstructionSkill) skillsEnabled.push('🧩 Complex Query Analysis');
        if (this.forwardThinkerSkill) skillsEnabled.push('🔮 Predictive Suggestions');

        if (skillsEnabled.length > 0) {
            const message = `Welcome! I'm powered by advanced AI skills:\n\n${skillsEnabled.join('\n')}\n\nI can help break down complex queries and predict what you might need next!`;
            setTimeout(() => {
                if (this.chat.addMessage) {
                    this.chat.addMessage(message, 'assistant');
                }
            }, 2000);
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

        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
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

        // Setup Wizard button
        document.getElementById('runSetupWizard')?.addEventListener('click', async () => {
            console.log('🧙‍♂️ Running setup wizard...');
            if (this.setupWizard) {
                // Hide settings modal first
                this.ui.hideSettingsModal();

                // Force run the wizard (even if already completed)
                const wizardConfig = await this.setupWizard.forceStart();
                if (wizardConfig) {
                    // Merge wizard config with app config
                    this.config = { ...this.config, ...wizardConfig };

                    // Reinitialize skills with new config
                    await this.initializeSkills();

                    // Reinitialize skills in chat manager
                    if (this.chat && this.chat.initializeSkills) {
                        this.chat.initializeSkills(this.config);
                    }

                    // Update UI
                    this.ui.showNotification('Configuration updated successfully!', 'success');
                    console.log('✅ Setup wizard completed and skills reinitialized');
                }
            } else {
                this.ui.showNotification('Setup wizard not available', 'error');
            }
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

        console.log(`📡 Loading iframe with URL: ${url}`);

        // Show loading
        loading.style.display = 'flex';
        loading.innerHTML = `
            <div style="text-align: center;">
                <div class="loading-spinner"></div>
                <p>Loading tool...</p>
            </div>
        `;

        // Clear any existing iframe content
        iframe.src = 'about:blank';

        // Small delay to ensure iframe is cleared
        setTimeout(() => {
            // Set up iframe load handler
            const onLoad = () => {
                console.log('✅ Iframe loaded successfully');
                loading.style.display = 'none';
                iframe.removeEventListener('load', onLoad);
                iframe.removeEventListener('error', onError);
            };

            // Handle load errors
            const onError = (e) => {
                console.error('❌ Iframe load error:', e);
                loading.innerHTML = `
                    <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                        <h3>Failed to load tool</h3>
                        <p style="margin: 20px 0; max-width: 500px; margin-left: auto; margin-right: auto;">
                            The tool couldn't be loaded. This might be due to:
                        </p>
                        <ul style="text-align: left; max-width: 500px; margin: 20px auto;">
                            <li>The tool's server blocking iframe embedding (X-Frame-Options)</li>
                            <li>Network connectivity issues</li>
                            <li>The tool URL is incorrect or the tool is down</li>
                        </ul>
                        <button onclick="window.app.refreshCurrentTool()" class="btn btn-primary" style="margin-top: 1rem;">
                            🔄 Try Again
                        </button>
                        <button onclick="window.app.showChatView()" class="btn btn-secondary" style="margin-top: 1rem; margin-left: 10px;">
                            ← Back to Dashboard
                        </button>
                    </div>
                `;
            };

            iframe.addEventListener('load', onLoad);
            iframe.addEventListener('error', onError);

            // Load the URL
            console.log(`🚀 Setting iframe src to: ${url}`);
            iframe.src = url;

            // Add timeout fallback (increased to 15 seconds for slower networks)
            setTimeout(() => {
                if (loading.style.display !== 'none') {
                    console.warn('⚠️ Iframe load timeout - tool may be blocked or slow');
                    onError(new Error('Load timeout'));
                }
            }, 15000);
        }, 100);
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

    async saveSettings() {
        const settings = {
            services: {
                inventory: { url: document.getElementById('inventoryUrl').value },
                grading: { url: document.getElementById('gradingUrl').value },
                scheduler: { url: document.getElementById('schedulerUrl').value },
                tools: { url: document.getElementById('toolsUrl').value }
            },
            darkMode: document.getElementById('darkMode').checked,
            enableDeconstructionSkill: document.getElementById('enableDeconstructionSkill')?.checked ?? true,
            enableForwardThinkerSkill: document.getElementById('enableForwardThinkerSkill')?.checked ?? true
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
        this.config.enableDeconstructionSkill = settings.enableDeconstructionSkill;
        this.config.enableForwardThinkerSkill = settings.enableForwardThinkerSkill;

        // Reinitialize skills with new settings
        await this.initializeSkills();

        // Reinitialize skills in chat manager
        if (this.chat && this.chat.initializeSkills) {
            this.chat.initializeSkills(this.config);
        }

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