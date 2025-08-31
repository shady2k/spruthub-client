const WebSocket = require("ws");

class WebSocketManager {
  constructor(wsUrl, logger) {
    this.wsUrl = wsUrl;
    this.log = logger;
    this.wsClient = null;
    this.isConnected = false;
    this.isTerminated = false;
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

    // Delay before attempting to reconnect
    setTimeout(() => {
      this.reconnect();
    }, 5000); // 5 seconds delay
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
    return new Promise((resolve, reject) => {
      this.isTerminated = true;
      if (this.wsClient) {
        // Add a timeout to prevent hanging
        const timeout = setTimeout(() => {
          this.wsClient.removeAllListeners("close");
          this.log.info("WebSocket close timeout, forcing termination");
          resolve();
        }, 5000); // 5 second timeout

        // Listen for the 'close' event
        this.wsClient.once("close", () => {
          clearTimeout(timeout);
          // Once the 'close' event is emitted, resolve the promise
          resolve();
        });

        // Attempt to close the WebSocket connection
        try {
          this.wsClient.close();
        } catch (error) {
          clearTimeout(timeout);
          // If there is an error while closing, remove the 'close' event listener
          // to prevent future resolutions and reject the promise
          this.wsClient.removeListener("close", resolve);
          reject(error);
        }
      } else {
        resolve();
      }
    });
  }

  isOpen() {
    return this.wsClient && this.wsClient.readyState === WebSocket.OPEN;
  }
}

module.exports = WebSocketManager;