/**
 * 📊 Enhanced Dashboard Manager
 * Professional dashboard with metrics, visualizations, and real-time updates
 */

class DashboardManager {
    constructor() {
        this.metrics = new Map();
        this.refreshInterval = null;
        this.updateInterval = 30000; // 30 seconds
    }

    async init() {
        await this.loadMetrics();
        this.renderMetricsCards();
        this.setupAutoRefresh();
        this.setupEventListeners();
    }

    /**
     * Load dashboard metrics from backend
     */
    async loadMetrics() {
        try {
            const api = window.app?.api;
            if (!api) {
                console.warn('API not available');
                return;
            }

            // Load inventory metrics
            const inventory = await api.callGoogleScript('inventory', 'getInventoryReport', []);
            const lowStock = await api.callGoogleScript('inventory', 'checkLowStock', []);
            const fleetReport = await api.callGoogleScript('inventory', 'getFleetReport', []);

            this.metrics.set('inventory', this.parseInventoryMetrics(inventory));
            this.metrics.set('lowStock', lowStock);
            this.metrics.set('fleet', this.parseFleetMetrics(fleetReport));

        } catch (error) {
            console.error('Failed to load metrics:', error);
            this.showError('Unable to load dashboard metrics');
        }
    }

    /**
     * Parse inventory report into metrics
     */
    parseInventoryMetrics(report) {
        if (!report) return { total: 0, locations: 0, value: 0 };

        // Extract numbers from report text
        const totalMatch = report.match(/Total Items:\s*(\d+)/);
        const locationsMatch = report.match(/Locations:\s*(\d+)/);

        return {
            total: totalMatch ? parseInt(totalMatch[1]) : 0,
            locations: locationsMatch ? parseInt(locationsMatch[1]) : 0,
            value: 0 // Could be calculated if we had pricing data
        };
    }

    /**
     * Parse fleet report into metrics
     */
    parseFleetMetrics(report) {
        if (!report) return { total: 0, active: 0, maintenance: 0 };

        const totalMatch = report.match(/Total Fleet Size:\s*(\d+)/);
        const activeMatch = report.match(/Active:\s*(\d+)/);
        const maintenanceMatch = report.match(/In Maintenance:\s*(\d+)/);

        return {
            total: totalMatch ? parseInt(totalMatch[1]) : 0,
            active: activeMatch ? parseInt(activeMatch[1]) : 0,
            maintenance: maintenanceMatch ? parseInt(maintenanceMatch[1]) : 0
        };
    }

    /**
     * Render metrics cards on dashboard
     */
    renderMetricsCards() {
        const container = document.getElementById('metricsGrid');
        if (!container) {
            console.warn('Metrics container not found');
            return;
        }

        const inventory = this.metrics.get('inventory') || { total: 0, locations: 0 };
        const lowStock = this.metrics.get('lowStock') || [];
        const fleet = this.metrics.get('fleet') || { total: 0, active: 0, maintenance: 0 };

        const cards = [
            {
                icon: '🌱',
                label: 'Total Inventory Items',
                value: inventory.total,
                change: null,
                status: 'success'
            },
            {
                icon: '⚠️',
                label: 'Low Stock Items',
                value: lowStock.length || 0,
                change: lowStock.length > 0 ? { value: lowStock.length, positive: false } : null,
                status: lowStock.length > 5 ? 'error' : 'warning'
            },
            {
                icon: '📍',
                label: 'Storage Locations',
                value: inventory.locations,
                change: null,
                status: 'info'
            },
            {
                icon: '🚛',
                label: 'Active Vehicles',
                value: `${fleet.active}/${fleet.total}`,
                change: fleet.maintenance > 0 ? { value: fleet.maintenance, positive: false } : null,
                status: fleet.maintenance > 0 ? 'warning' : 'success'
            }
        ];

        container.innerHTML = cards.map(card => this.createMetricCard(card)).join('');
    }

    /**
     * Create a metric card HTML
     */
    createMetricCard({ icon, label, value, change, status }) {
        const changeHTML = change ? `
            <div class="metric-change ${change.positive ? 'positive' : 'negative'}">
                <span>${change.positive ? '↑' : '↓'}</span>
                <span>${change.value}</span>
            </div>
        ` : '';

        return `
            <div class="metric-card ${status}" data-metric="${label}">
                <div class="metric-header">
                    <div class="metric-info">
                        <div class="metric-value">${value}</div>
                        <div class="metric-label">${label}</div>
                        ${changeHTML}
                    </div>
                    <div class="metric-icon ${status}">${icon}</div>
                </div>
            </div>
        `;
    }

    /**
     * Setup auto-refresh for metrics
     */
    setupAutoRefresh() {
        this.refreshInterval = setInterval(async () => {
            await this.loadMetrics();
            this.renderMetricsCards();
        }, this.updateInterval);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshMetrics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.disabled = true;
                await this.loadMetrics();
                this.renderMetricsCards();
                this.showToast('Dashboard refreshed', 'success');
                setTimeout(() => refreshBtn.disabled = false, 2000);
            });
        }

        // Metric card clicks
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.metric-card');
            if (card) {
                const metric = card.dataset.metric;
                this.handleMetricClick(metric);
            }
        });
    }

    /**
     * Handle metric card click
     */
    handleMetricClick(metric) {
        // Could open detailed view, filter data, etc.
        console.log('Metric clicked:', metric);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        if (window.app?.ui) {
            window.app.ui.showNotification(message, type);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

/**
 * 🔔 Toast Notification System
 */
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.defaultDuration = 5000;
        this.init();
    }

    init() {
        // Create toast container
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show toast notification
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        const id = Date.now();
        const toast = this.createToast(id, message, type);

        this.container.appendChild(toast);
        this.toasts.set(id, toast);

        // Auto remove
        setTimeout(() => this.remove(id), duration);

        return id;
    }

    /**
     * Create toast element
     */
    createToast(id, message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.toastId = id;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close" onclick="window.toastManager.remove(${id})">×</button>
        `;

        return toast;
    }

    /**
     * Remove toast
     */
    remove(id) {
        const toast = this.toasts.get(id);
        if (toast) {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                toast.remove();
                this.toasts.delete(id);
            }, 300);
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Shorthand methods
     */
    success(message) { return this.show(message, 'success'); }
    error(message) { return this.show(message, 'error'); }
    warning(message) { return this.show(message, 'warning'); }
    info(message) { return this.show(message, 'info'); }
}

/**
 * 📈 Data Visualization Helper
 */
class ChartHelper {
    /**
     * Create simple bar chart
     */
    static createBarChart(data, container) {
        const max = Math.max(...data.map(d => d.value));

        const html = data.map(item => {
            const percentage = (item.value / max) * 100;
            return `
                <div class="chart-bar">
                    <div class="chart-bar-label">${item.label}</div>
                    <div class="chart-bar-container">
                        <div class="chart-bar-fill" style="width: ${percentage}%">
                            <span class="chart-bar-value">${item.value}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Create donut chart data
     */
    static createDonutData(data) {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = 0;

        return data.map(item => {
            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;
            const segment = {
                ...item,
                percentage: percentage.toFixed(1),
                startAngle: currentAngle,
                endAngle: currentAngle + angle
            };
            currentAngle += angle;
            return segment;
        });
    }
}

// Initialize toast manager globally
window.toastManager = new ToastManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardManager, ToastManager, ChartHelper };
}
