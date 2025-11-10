/**
 * DIContainer - Dependency Injection Container
 *
 * Manages creation and lifecycle of application services.
 * Replaces the global window.app pattern with proper dependency injection.
 *
 * @example
 * // Register a service
 * container.register('apiManager', APIManager, ['configService', 'eventBus']);
 *
 * // Get a service (creates it if needed)
 * const api = container.get('apiManager');
 *
 * // Register a singleton instance
 * container.registerInstance('eventBus', eventBus);
 */

export class DIContainer {
  constructor() {
    /** @private Map of service definitions */
    this.services = new Map();

    /** @private Map of cached singleton instances */
    this.instances = new Map();

    /** @private Track services being created to detect circular dependencies */
    this.creating = new Set();
  }

  /**
   * Register a service class
   * @param {string} name - Service name
   * @param {Function} Class - Service class constructor
   * @param {string[]} [dependencies=[]] - Array of dependency names
   * @param {boolean} [singleton=true] - Whether to cache instance (singleton pattern)
   */
  register(name, Class, dependencies = [], singleton = true) {
    this.services.set(name, {
      Class,
      dependencies,
      singleton,
    });
  }

  /**
   * Register an existing instance
   * @param {string} name - Service name
   * @param {any} instance - Service instance
   */
  registerInstance(name, instance) {
    this.instances.set(name, instance);
  }

  /**
   * Register a factory function
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that creates the service
   * @param {string[]} [dependencies=[]] - Array of dependency names
   * @param {boolean} [singleton=true] - Whether to cache instance
   */
  registerFactory(name, factory, dependencies = [], singleton = true) {
    this.services.set(name, {
      factory,
      dependencies,
      singleton,
    });
  }

  /**
   * Get a service instance
   * @param {string} name - Service name
   * @returns {any} Service instance
   * @throws {Error} If service not found or circular dependency detected
   */
  get(name) {
    // Return cached instance if available
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Get service definition
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service "${name}" not found in container`);
    }

    // Detect circular dependencies
    if (this.creating.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`);
    }

    this.creating.add(name);

    try {
      // Resolve dependencies
      const deps = service.dependencies.map(depName => this.get(depName));

      // Create instance
      let instance;
      if (service.factory) {
        instance = service.factory(...deps);
      } else {
        instance = new service.Class(...deps);
      }

      // Cache if singleton
      if (service.singleton) {
        this.instances.set(name, instance);
      }

      return instance;
    } finally {
      this.creating.delete(name);
    }
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name) || this.instances.has(name);
  }

  /**
   * Clear all cached instances
   * @param {string} [name] - Optional: clear specific service only
   */
  clear(name) {
    if (name) {
      this.instances.delete(name);
    } else {
      this.instances.clear();
    }
  }

  /**
   * Get all registered service names
   * @returns {string[]}
   */
  getServiceNames() {
    const names = new Set([
      ...this.services.keys(),
      ...this.instances.keys(),
    ]);
    return Array.from(names);
  }

  /**
   * Reset the container (clear all services and instances)
   */
  reset() {
    this.services.clear();
    this.instances.clear();
    this.creating.clear();
  }

  /**
   * Create a child container that inherits parent services
   * @returns {DIContainer}
   */
  createChild() {
    const child = new DIContainer();

    // Copy service definitions (not instances)
    this.services.forEach((service, name) => {
      child.services.set(name, service);
    });

    return child;
  }
}

// Export singleton instance
export const container = new DIContainer();
