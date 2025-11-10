/**
 * EventBus - Central event management for decoupled component communication
 *
 * Implements the publish-subscribe pattern to allow components to communicate
 * without direct dependencies on each other.
 *
 * @example
 * // Subscribe to an event
 * eventBus.on('user:login', (data) => {
 *   console.log('User logged in:', data);
 * });
 *
 * // Emit an event
 * eventBus.emit('user:login', { userId: 123 });
 *
 * // Unsubscribe
 * eventBus.off('user:login', handler);
 */

export class EventBus {
  constructor() {
    /** @private */
    this.events = new Map();

    /** @private */
    this.onceHandlers = new WeakMap();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }

    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    this.events.get(event).add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event that fires only once
   * @param {string} event - Event name
   * @param {Function} handler - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(event, handler) {
    const wrappedHandler = (...args) => {
      this.off(event, wrappedHandler);
      handler(...args);
    };

    this.onceHandlers.set(wrappedHandler, handler);
    return this.on(event, wrappedHandler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} handler - Callback function to remove
   */
  off(event, handler) {
    const handlers = this.events.get(event);
    if (!handlers) return;

    // Check if this is a wrapped once handler
    const originalHandler = this.onceHandlers.get(handler);
    if (originalHandler) {
      handlers.delete(handler);
      this.onceHandlers.delete(handler);
    } else {
      handlers.delete(handler);
    }

    // Clean up empty event sets
    if (handlers.size === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to handlers
   */
  emit(event, ...args) {
    const handlers = this.events.get(event);
    if (!handlers) return;

    // Create a copy to avoid issues if handlers modify the set during iteration
    const handlersArray = Array.from(handlers);

    for (const handler of handlersArray) {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
        // Continue executing other handlers even if one fails
      }
    }
  }

  /**
   * Emit an event asynchronously
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to handlers
   * @returns {Promise<void>}
   */
  async emitAsync(event, ...args) {
    const handlers = this.events.get(event);
    if (!handlers) return;

    const handlersArray = Array.from(handlers);
    const promises = handlersArray.map(handler =>
      Promise.resolve().then(() => handler(...args))
    );

    await Promise.allSettled(promises);
  }

  /**
   * Remove all subscribers for an event or all events
   * @param {string} [event] - Event name (optional - if not provided, clears all)
   */
  clear(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get the number of handlers for an event
   * @param {string} event - Event name
   * @returns {number}
   */
  listenerCount(event) {
    const handlers = this.events.get(event);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get all event names that have listeners
   * @returns {string[]}
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Check if an event has any listeners
   * @param {string} event - Event name
   * @returns {boolean}
   */
  hasListeners(event) {
    return this.listenerCount(event) > 0;
  }
}

// Export singleton instance
export const eventBus = new EventBus();
