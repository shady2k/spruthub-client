const WebSocket = require("ws");

class WebSocketManager {
  constructor(wsUrl, logger) {
    this.wsUrl = wsUrl;
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
    this.wsClient = new WebSocket(this.wsUrl);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.wsClient) return;

    this.wsClient.on("open", () => this.handleConnection());
    this.wsClient.on("message", (data) => this.handleMessage(data));
    this.wsClient.on("close", () => this.handleDisconnection());
    this.wsClient.on("error", (error) => this.handleError(error));
  }

  handleConnection() {
    this.log.info("Spruthub connected!");
    this.isConnected = true;
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
    }, 5000); // 5 seconds delay
    
    // Unref the timeout so it doesn't keep the process alive
    this.reconnectTimeout.unref();
  }

  reconnect() {
    this.log.info("Attempting to reconnect...");
    this.connect();
  }

  handleError(error) {
    this.log.error("Spruthub error:", error);
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

  cleanup() {
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