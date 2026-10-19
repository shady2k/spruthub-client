const WebSocket = require("ws");

class WebSocketManager {
  constructor(wsUrl, logger, options = {}) {
    this.wsUrl = wsUrl;
    this.retryAttempt = 0;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30000;
    this.heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? 10000;
    this.retryBase = options.baseMs || 1000;
    this.retryMax = options.maxMs || 30000;
    this.log = logger;
    this.wsClient = null;
    this.isConnected = false;
    this.isTerminated = false;
    this.reconnectTimeout = null;
    this.connectionHandlers = {
      onOpen: null,
      onMessage: null,
      onClose: null,
      onError: null
    };
  }

  setEventHandlers({ onOpen, onMessage, onClose, onError }) {
    this.connectionHandlers = { onOpen, onMessage, onClose, onError };
  }

  connect() {
    if (this.isTerminated) return;
    this.wsClient = new WebSocket(this.wsUrl, { handshakeTimeout: 10000 });
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.wsClient) return;

    this.wsClient.on("open", () => this.handleConnection());
    this.wsClient.on("message", (data) => this.handleMessage(data));
    this.wsClient.on("close", () => this.handleDisconnection());
    this.wsClient.on("error", (error) => this.handleError(error));
    this.wsClient.on("pong", () => {
      this.retryAttempt = 0;
      clearTimeout(this.pongDeadline);
      this.pongDeadline = null;
    });
  }

  handleConnection() {
    this.log.info("Spruthub connected!");
    this.isConnected = true;
    this.clearHeartbeat();
    if (this.heartbeatIntervalMs > 0) {
      this.heartbeat = setInterval(() => {
        if (!this.isOpen() || this.pongDeadline) return;
        // Only a missing reply to a WebSocket control ping is failure evidence.
        // Silence in hub logs is normal and never triggers this watchdog.
        this.pongDeadline = setTimeout(() => {
          this.pongDeadline = null;
          if (this.wsClient) this.wsClient.terminate();
        }, this.heartbeatTimeoutMs);
        this.pongDeadline.unref();
        try { this.wsClient.ping(); } catch { this.wsClient.terminate(); }
      }, this.heartbeatIntervalMs);
      this.heartbeat.unref();
    }
    if (this.connectionHandlers.onOpen) {
      this.connectionHandlers.onOpen();
    }
  }

  handleMessage(data) {
    if (this.connectionHandlers.onMessage) {
      this.connectionHandlers.onMessage(data);
    }
  }

  handleDisconnection() {
    this.clearHeartbeat();
    this.isConnected = false;
    if (this.isTerminated) {
      this.log.info("Spruthub connection closed!");
      return;
    }
    this.log.info("Spruthub connection closed, trying to reconnect...");
    this.isConnected = false;

    if (this.connectionHandlers.onClose) {
      this.connectionHandlers.onClose();
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Don't reconnect if connection was intentionally terminated
    if (this.isTerminated) {
      return;
    }

    // Delay before attempting to reconnect
    this.reconnectTimeout = setTimeout(() => {
      this.reconnect();
    }, Math.min(this.retryMax, this.retryBase * 2 ** Math.min(this.retryAttempt++, 10)) * (0.5 + Math.random() * 0.5));
    
    // Unref the timeout so it doesn't keep the process alive
    if (!this.keepAlive) this.reconnectTimeout.unref();
  }

  resetConnection() {
    // An unacknowledged subscribe may already exist remotely. Fence that socket.
    this.isConnected = false;
    this.clearHeartbeat();
    if (this.wsClient && !this.isTerminated) this.wsClient.terminate();
  }

  reconnect() {
    this.log.info("Attempting to reconnect...");
    this.connect();
  }

  handleError(error) {
    this.log.error("Spruthub WebSocket transport error");
    if (this.connectionHandlers.onError) {
      this.connectionHandlers.onError(error);
    }
  }

  send(data) {
    return new Promise((resolve, reject) => {
      if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
        this.wsClient.send(data, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } else {
        this.log.error("WebSocket is not open. Cannot send message.");
        reject(new Error("WebSocket is not open"));
      }
    });
  }

  async close() {
    return new Promise((resolve) => {
      this.isTerminated = true;
      this.clearHeartbeat();
      clearTimeout(this.reconnectTimeout);
      if (this.wsClient) {
        // Add a timeout to prevent hanging
        const timeout = setTimeout(() => {
          this.log.info("WebSocket close timeout, forcing termination");
          this.forceCleanup();
          resolve();
        }, 1000); // 1 second timeout for tests
        
        // Unref the timeout so it doesn't keep the process alive
        timeout.unref();

        // Listen for the 'close' event
        this.wsClient.once("close", () => {
          clearTimeout(timeout);
          this.cleanup();
          resolve();
        });

        // Attempt to close the WebSocket connection
        try {
          this.wsClient.close();
        } catch (error) {
          clearTimeout(timeout);
          this.forceCleanup();
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  clearHeartbeat() {
    clearInterval(this.heartbeat);
    clearTimeout(this.pongDeadline);
    this.heartbeat = null;
    this.pongDeadline = null;
  }

  cleanup() {
    this.clearHeartbeat();
    if (this.wsClient) {
      this.wsClient.removeAllListeners();
      this.wsClient = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isConnected = false;
  }

  forceCleanup() {
    this.clearHeartbeat();
    if (this.wsClient) {
      this.wsClient.removeAllListeners();
      try {
        this.wsClient.terminate();
      } catch (error) {
        // Ignore termination errors
      }
      this.wsClient = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isConnected = false;
  }

  isOpen() {
    return this.wsClient && this.wsClient.readyState === WebSocket.OPEN;
  }
}

module.exports = WebSocketManager;