const Helpers = require('../utils/helpers');

class LogManager {
  constructor(callMethod, ensureConnectionAndAuthMethod, logger) {
    this.call = callMethod;
    this.ensureConnectionAndAuth = ensureConnectionAndAuthMethod;
    this.log = logger;
    
    // Track active log subscriptions
    this.activeSubscriptions = new Map();
    this.logEventHandlers = new Map();
    this.pendingHandlers = new Set();
  }

  async getLogs(count = 100) {
    await this.ensureConnectionAndAuth();

    try {
      const logResult = await this.call({
        log: {
          list: {
            count: count
          }
        }
      });

      return Helpers.handleApiResponse(
        logResult,
        ["log", "list", "log"],
        this.log,
        "Logs retrieved successfully"
      );
    } catch (error) {
      this.log.error("Error getting logs:", error);
      throw error;
    }
  }

  async subscribeLogs(onLogEvent) {
    await this.ensureConnectionAndAuth();
    // Events can arrive in the same transport batch as the subscribe response.
    if (typeof onLogEvent === "function") this.pendingHandlers.add(onLogEvent);

    try {
      const subscribeResult = await this.call({
        log: {
          subscribe: {}
        }
      });

      const response = Helpers.handleApiResponse(
        subscribeResult,
        ["log", "subscribe"],
        this.log,
        "Log subscription created successfully"
      );

      if (response.isSuccess && response.data && response.data.uuid) {
        const uuid = response.data.uuid;
        
        // Store subscription info
        this.activeSubscriptions.set(uuid, {
          uuid,
          createdAt: new Date(),
          active: true
        });

        // Store event handler
        if (onLogEvent && typeof onLogEvent === 'function') {
          this.logEventHandlers.set(uuid, onLogEvent);
        }

        this.log.debug(`Log subscription created with UUID: ${uuid}`);
        
        return {
          isSuccess: true,
          code: 0,
          message: "Log subscription created successfully",
          data: { 
            uuid,
            subscription: this.activeSubscriptions.get(uuid)
          }
        };
      }

      return response;
    } catch (error) {
      this.log.error("Error subscribing to logs:", error);
      throw error;
    } finally {
      this.pendingHandlers.delete(onLogEvent);
    }
  }

  async unsubscribeLogs(uuid) {
    await this.ensureConnectionAndAuth();

    if (!this.activeSubscriptions.has(uuid)) {
      return {
        isSuccess: false,
        code: -1,
        message: `No active subscription found with UUID: ${uuid}`,
        data: null
      };
    }

    try {
      const unsubscribeResult = await this.call({
        log: {
          unsubscribe: {
            uuid: uuid
          }
        }
      });

      const response = Helpers.handleApiResponse(
        unsubscribeResult,
        ["log", "unsubscribe"],
        this.log,
        "Log subscription cancelled successfully"
      );

      if (response.isSuccess) {
        // Clean up local tracking
        this.activeSubscriptions.delete(uuid);
        this.logEventHandlers.delete(uuid);
        
        this.log.debug(`Log subscription cancelled for UUID: ${uuid}`);
      }

      return response;
    } catch (error) {
      this.log.error(`Error unsubscribing from logs (UUID: ${uuid}):`, error);
      throw error;
    }
  }

  async unsubscribeAllLogs() {
    const promises = [];
    const uuids = Array.from(this.activeSubscriptions.keys());
    
    for (const uuid of uuids) {
      promises.push(this.unsubscribeLogs(uuid));
    }

    if (promises.length === 0) {
      return {
        isSuccess: true,
        code: 0,
        message: "No active subscriptions to cancel",
        data: { cancelled: 0 }
      };
    }

    try {
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.isSuccess).length;
      
      return {
        isSuccess: true,
        code: 0,
        message: `Cancelled ${successful} of ${results.length} log subscriptions`,
        data: { cancelled: successful, total: results.length }
      };
    } catch (error) {
      this.log.error("Error cancelling all log subscriptions:", error);
      throw error;
    }
  }

  getActiveSubscriptions() {
    return Array.from(this.activeSubscriptions.values());
  }

  handleLogEvent(eventData) {
    if (!eventData || !eventData.event || !eventData.event.log || !Array.isArray(eventData.event.log.log)) {
      this.log.warn("Invalid log event data received");
      return;
    }

    const logEntries = eventData.event.log.log;
    
    for (const handler of this.pendingHandlers) {
      for (const entry of logEntries) {
        if (!entry || typeof entry !== 'object') continue;
        try {
          handler({ subscriptionId: null, timestamp: entry.time, level: entry.level,
            component: entry.path, message: entry.message, raw: entry });
        } catch { this.log.warn('Pending log handler failed'); }
      }
    }
    // Call all registered event handlers
    for (const [uuid, handler] of this.logEventHandlers) {
      if (this.activeSubscriptions.has(uuid)) {
        try {
          for (const logEntry of logEntries) {
            if (!logEntry || typeof logEntry !== "object") continue;
            handler({
              subscriptionId: uuid,
              timestamp: logEntry.time,
              level: logEntry.level,
              component: logEntry.path,
              message: logEntry.message,
              raw: logEntry
            });
          }
        } catch (error) {
          this.log.error(`Error in log event handler for UUID ${uuid}:`, error);
        }
      }
    }
  }

  cleanup() {
    this.activeSubscriptions.clear();
    this.logEventHandlers.clear();
    this.pendingHandlers.clear();
  }
}

module.exports = LogManager;