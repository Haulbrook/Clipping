/**
 * 💬 Chat Manager - Handles chat interface and AI routing
 */

class ChatManager {
    constructor() {
        this.messageHistory = [];
        this.isTyping = false;
        this.currentConversationId = null;
        
        // AI routing keywords for each tool
        this.toolKeywords = {
            inventory: ['inventory', 'stock', 'plants', 'supplies', 'materials', 'clippings', 'search', 'find', 'boxwood', 'mulch', 'fertilizer'],
            grading: ['grade', 'quality', 'assess', 'evaluation', 'sell', 'pricing', 'condition', 'value'],
            scheduler: ['schedule', 'calendar', 'crew', 'task', 'appointment', 'plan', 'assign', 'daily', 'tomorrow'],
            tools: ['tools', 'rental', 'checkout', 'equipment', 'borrow', 'return', 'maintenance']
        };
    }

    init() {
        this.setupEventListeners();
        this.loadChatHistory();
        this.startNewConversation();
    }

    setupEventListeners() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => this.handleInputKeyDown(e));
            chatInput.addEventListener('input', () => this.handleInputChange());
            chatInput.addEventListener('paste', () => setTimeout(() => this.autoResizeInput(), 0));
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendClick());
        }

        // Auto-resize textarea
        this.autoResizeInput();
    }

    handleInputKeyDown(e) {
        const chatInput = e.target;
        
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift+Enter: New line
                return;
            } else {
                // Enter: Send message
                e.preventDefault();
                this.handleSendClick();
            }
        }
        
        // Auto-resize on keydown
        setTimeout(() => this.autoResizeInput(), 0);
    }

    handleInputChange() {
        this.autoResizeInput();
        this.updateSendButton();
    }

    handleSendClick() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (message && !this.isTyping) {
            this.sendMessage(message);
            chatInput.value = '';
            this.autoResizeInput();
            this.updateSendButton();
        }
    }

    async sendMessage(message) {
        if (this.isTyping) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator(true);
        
        try {
            // Route message to appropriate tool or provide general response
            const response = await this.processMessage(message);
            
            // Hide typing indicator
            this.showTypingIndicator(false);
            
            // Add assistant response
            this.addMessage(response.content, 'assistant', response.type);
            
            // If routed to a tool, optionally open it
            if (response.toolId && response.shouldOpenTool) {
                setTimeout(() => {
                    if (confirm(`Would you like to open the ${response.toolName} tool?`)) {
                        window.app.openTool(response.toolId);
                    }
                }, 1000);
            }
            
        } catch (error) {
            this.showTypingIndicator(false);
            this.addMessage('Sorry, I encountered an error processing your request. Please try again.', 'assistant', 'error');
            console.error('Chat processing error:', error);
        }
        
        // Save conversation
        this.saveChatHistory();
    }

    async processMessage(message) {
        // Determine which tool this message is most relevant to
        const toolRoute = this.determineToolRoute(message);
        
        if (toolRoute.toolId === 'general') {
            return this.generateGeneralResponse(message);
        } else {
            return this.generateToolSpecificResponse(message, toolRoute);
        }
    }

    determineToolRoute(message) {
        const messageLower = message.toLowerCase();
        const scores = {};
        
        // Calculate relevance score for each tool
        Object.entries(this.toolKeywords).forEach(([toolId, keywords]) => {
            scores[toolId] = 0;
            keywords.forEach(keyword => {
                if (messageLower.includes(keyword)) {
                    // Exact match gets higher score
                    if (messageLower.split(/\s+/).includes(keyword)) {
                        scores[toolId] += 2;
                    } else {
                        scores[toolId] += 1;
                    }
                }
            });
        });
        
        // Find the tool with the highest score
        const bestMatch = Object.entries(scores).reduce((best, [toolId, score]) => {
            return score > best.score ? { toolId, score } : best;
        }, { toolId: 'general', score: 0 });
        
        // Only route to tool if score is above threshold
        if (bestMatch.score >= 2) {
            return {
                toolId: bestMatch.toolId,
                confidence: Math.min(bestMatch.score / 5, 1),
                keywords: this.extractMatchingKeywords(message, bestMatch.toolId)
            };
        }
        
        return { toolId: 'general', confidence: 0, keywords: [] };
    }

    extractMatchingKeywords(message, toolId) {
        const messageLower = message.toLowerCase();
        const keywords = this.toolKeywords[toolId] || [];
        return keywords.filter(keyword => messageLower.includes(keyword));
    }

    generateGeneralResponse(message) {
        // General AI-like responses for common queries
        const generalResponses = {
            greeting: [
                "Hello! I'm here to help you with Deep Roots operations. I can assist with inventory management, plant grading, crew scheduling, and tool checkout.",
                "Hi there! What can I help you with today? I can help with inventory, grading, scheduling, or tools.",
                "Welcome to Deep Roots Operations! I'm ready to help with any operational questions you have."
            ],
            help: [
                "I can help you with:\n\n🌱 **Inventory Management** - Search stock, check quantities, manage supplies\n⭐ **Plant Grading** - Quality assessment and pricing decisions\n📅 **Crew Scheduling** - Daily planning and task assignments\n🔧 **Tool Checkout** - Rental and equipment management\n\nWhat would you like to work on?",
                "Here's what I can do for you:\n\n• Check inventory and stock levels\n• Help grade plants for quality and pricing\n• Assist with crew scheduling and planning\n• Manage tool rentals and checkouts\n\nJust ask me anything related to these areas!"
            ],
            thanks: [
                "You're welcome! Let me know if you need help with anything else.",
                "Happy to help! Feel free to ask if you have more questions.",
                "Glad I could assist! What else can I help you with?"
            ]
        };

        const messageLower = message.toLowerCase();
        let responseType = 'general';
        let responses = [];

        // Determine response type
        if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
            responseType = 'greeting';
            responses = generalResponses.greeting;
        } else if (messageLower.includes('help') || messageLower.includes('what can you do')) {
            responseType = 'help';
            responses = generalResponses.help;
        } else if (messageLower.includes('thank') || messageLower.includes('thanks')) {
            responseType = 'thanks';
            responses = generalResponses.thanks;
        } else {
            // Default response with tool suggestions
            responses = [
                "I'm not sure exactly what you're looking for, but I can help you with:\n\n🌱 **Inventory** - if you need to check stock or supplies\n⭐ **Grading** - if you're evaluating plant quality\n📅 **Scheduling** - if you're planning crew work\n🔧 **Tools** - if you need equipment\n\nCould you be more specific about what you need help with?"
            ];
        }

        return {
            content: responses[Math.floor(Math.random() * responses.length)],
            type: 'general',
            toolId: null,
            shouldOpenTool: false
        };
    }

    generateToolSpecificResponse(message, route) {
        const { toolId, confidence, keywords } = route;
        const config = window.app?.config?.services[toolId];
        
        if (!config) {
            return this.generateGeneralResponse(message);
        }

        const responses = {
            inventory: [
                `I can help you search the inventory! Based on your query about "${keywords.join(', ')}", I'll check our stock levels and locations for you.`,
                `Let me look up that inventory information for you. I can search for plant stock, supplies, and materials.`,
                `I'll search our inventory system for "${keywords.join(', ')}" and show you what's available, quantities, and locations.`
            ],
            grading: [
                `I can help you with plant quality assessment and grading. Let me connect you to the grading tool to evaluate "${keywords.join(', ')}" and determine pricing.`,
                `For quality evaluation and pricing decisions, I'll route you to our grading system. This will help assess plant condition and market value.`,
                `Let me open the grading tool to help you evaluate quality and make selling decisions based on current market conditions.`
            ],
            scheduler: [
                `I can help you with crew scheduling and task planning. Let me access the scheduling system to handle "${keywords.join(', ')}" assignments.`,
                `For crew management and daily planning, I'll connect you to our scheduling tool to organize tasks and assignments.`,
                `Let me open the scheduler to help you plan crew work, assign tasks, and manage daily operations.`
            ],
            tools: [
                `I can help you with tool rentals and equipment checkout. Let me access the tool management system for "${keywords.join(', ')}" requests.`,
                `For equipment management and tool checkout, I'll connect you to our rental system to track availability and assignments.`,
                `Let me open the tool checkout system to help you manage equipment rentals and track tool usage.`
            ]
        };

        const toolResponses = responses[toolId] || [];
        const response = toolResponses[Math.floor(Math.random() * toolResponses.length)];

        return {
            content: response,
            type: 'tool-routing',
            toolId: toolId,
            toolName: config.name,
            shouldOpenTool: confidence > 0.7,
            confidence: confidence
        };
    }

    addMessage(content, sender, type = 'normal') {
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) return;

        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const messageElement = this.createMessageElement(content, sender, type, messageId);
        
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        // Add to message history
        this.messageHistory.push({
            id: messageId,
            content,
            sender,
            type,
            timestamp: new Date().toISOString()
        });
        
        // Trigger animation
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 50);
    }

    createMessageElement(content, sender, type, messageId) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.id = messageId;
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(10px)';
        messageDiv.style.transition = 'all 0.3s ease';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (sender === 'user') {
            avatar.textContent = window.app?.user?.avatar || '👤';
        } else {
            avatar.textContent = '🌱';
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Format content (support for markdown-like formatting)
        contentDiv.innerHTML = this.formatMessageContent(content, type);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        return messageDiv;
    }

    formatMessageContent(content, type) {
        // Basic markdown-like formatting
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
            .replace(/`(.*?)`/g, '<code>$1</code>') // `code`
            .replace(/\n/g, '<br>'); // line breaks
        
        // Handle lists
        if (formatted.includes('•')) {
            formatted = formatted.replace(/(•.*?)(<br>|$)/g, '<li>$1</li>');
            formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        }
        
        return formatted;
    }

    showTypingIndicator(show) {
        this.isTyping = show;
        const indicator = document.getElementById('typingIndicator');
        const sendBtn = document.getElementById('sendBtn');
        
        if (indicator) {
            indicator.classList.toggle('hidden', !show);
        }
        
        if (sendBtn) {
            sendBtn.disabled = show;
        }
    }

    autoResizeInput() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;
        
        chatInput.style.height = 'auto';
        const scrollHeight = Math.min(chatInput.scrollHeight, 150); // max height
        chatInput.style.height = scrollHeight + 'px';
    }

    updateSendButton() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (chatInput && sendBtn) {
            const hasContent = chatInput.value.trim().length > 0;
            sendBtn.disabled = !hasContent || this.isTyping;
        }
    }

    startNewConversation() {
        this.currentConversationId = `conv-${Date.now()}`;
        this.messageHistory = [];
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('chatHistory');
            if (saved) {
                const history = JSON.parse(saved);
                // Only load recent messages (last 10)
                const recentMessages = history.slice(-10);
                
                recentMessages.forEach(msg => {
                    this.addMessage(msg.content, msg.sender, msg.type);
                });
            }
        } catch (error) {
            console.warn('Could not load chat history:', error);
        }
    }

    saveChatHistory() {
        try {
            // Only save last 50 messages to prevent localStorage bloat
            const recentMessages = this.messageHistory.slice(-50);
            localStorage.setItem('chatHistory', JSON.stringify(recentMessages));
        } catch (error) {
            console.warn('Could not save chat history:', error);
        }
    }

    clearChatHistory() {
        this.messageHistory = [];
        const chatHistory = document.getElementById('chatHistory');
        if (chatHistory) {
            // Keep welcome message, remove others
            const messages = chatHistory.querySelectorAll('.message:not(.welcome-message)');
            messages.forEach(msg => msg.remove());
        }
        localStorage.removeItem('chatHistory');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
}