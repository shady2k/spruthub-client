const WebSocketManager = require('./websocket');
const AuthManager = require('./auth');
const Queue = require('../queue');
const DeviceManager = require('../entities/device');
const HubManager = require('../entities/hub');
const RoomManager = require('../entities/room');
const ScenarioManager = require('../entities/scenario');
const SystemManager = require('../entities/system');

class Sprut {
  constructor(opts) {
    const { wsUrl, sprutEmail, sprutPassword, serial, logger } = opts;
    this.log = logger;
    this.serial = serial;
    this.idCounter = 1;
    this.queue = new Queue();

    if (!wsUrl || !sprutEmail || !sprutPassword || !serial) {
      throw new Error(
        "wsUrl, sprutEmail, sprutPassword, serial must be set as env variables"
      );
    }

    // Initialize WebSocket manager
    this.wsManager = new WebSocketManager(wsUrl, logger);
    this.wsManager.setEventHandlers({
      onOpen: () => this.handleConnection(),
      onMessage: (data) => this.onMessage(data),
      onClose: () => this.handleDisconnection(),
      onError: (error) => this.handleError(error)
    });

    // Initialize Auth manager
    this.authManager = new AuthManager(sprutEmail, sprutPassword, logger, (json) => this.call(json));

    // Initialize entity managers
    this.deviceManager = new DeviceManager(
      (json) => this.call(json),
      () => this.ensureConnectionAndAuthentication(),
      logger
    );

    this.hubManager = new HubManager(
      (json) => this.call(json),
      () => this.ensureConnectionAndAuthentication(),
      logger
    );

    this.roomManager = new RoomManager(
      (json) => this.call(json),
      () => this.ensureConnectionAndAuthentication(),
      logger
    );

    this.scenarioManager = new ScenarioManager(
      (json) => this.call(json),
      () => this.ensureConnectionAndAuthentication(),
      logger
    );

    this.systemManager = new SystemManager(
      this.hubManager,
      this.deviceManager,
      this.roomManager,
      this.scenarioManager
    );

    // Start connection
    this.wsManager.connect();
  }

  onMessage(data) {
    try {
      const response = JSON.parse(data);
      if (!response.event) {
        this.log.debug(response, "Received message:");
      }
      const id = response.id;
      const callback = this.queue.get(id);
      if (callback) {
        callback(response);
        this.queue.remove(id);
      }
    } catch (error) {
      this.log.error("Error parsing message:", error);
    }
  }

  handleConnection() {
    // Additional connection logic can be added here
  }

  handleDisconnection() {
    // Additional disconnection logic can be added here
  }

  handleError(_error) {
    // Additional error handling can be added here
  }

  async connected() {
    return new Promise((resolve) => {
      if (this.wsManager.isConnected) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (this.wsManager.isConnected) {
            resolve();
            clearInterval(interval);
          }
        }, 100);
      }
    });
  }

  async ensureConnectionAndAuthentication() {
    if (!this.wsManager.isConnected) {
      throw new Error("Not connected");
    }
    await this.authManager.ensureAuthenticated();
  }

  async call(json) {
    return new Promise((resolve, reject) => {
      const id = this.generateNextId();
      const payload = {
        jsonrpc: "2.0",
        params: json,
        id,
        token: this.authManager.getToken(),
        serial: this.serial,
      };

      if (this.wsManager.isOpen()) {
        this.wsManager.send(JSON.stringify(payload))
          .then(() => {
            this.queue.add(id, (response) => {
              if (response.error && response.error.code === -666003) {
                // Token is not valid, attempt retry with fresh token
                this.retryCallWithFreshToken(json, resolve, reject);
              } else {
                resolve(response);
              }
            });
          })
          .catch(reject);
      } else {
        this.log.error("WebSocket is not open. Cannot send message.");
        reject(new Error("WebSocket is not open"));
      }
    });
  }

  async retryCallWithFreshToken(json, resolve, reject) {
    try {
      const authResult = await this.authManager.refreshToken();
      if (authResult.isError) {
        throw new Error("Authentication failed.");
      }
      // Retry the original call with the new token
      const retryResponse = await this.call(json);
      resolve(retryResponse);
    } catch (error) {
      reject(error);
    }
  }

  generateNextId() {
    return this.idCounter++;
  }

  async close() {
    return await this.wsManager.close();
  }

  // Delegate methods to entity managers
  async execute(command, params) {
    return await this.deviceManager.execute(command, params);
  }

  async listAccessories(expand) {
    return await this.deviceManager.listAccessories(expand);
  }

  getControllableCharacteristics(accessories) {
    return this.deviceManager.getControllableCharacteristics(accessories);
  }

  getDeviceInfo(accessories, accessoryId) {
    return this.deviceManager.getDeviceInfo(accessories, accessoryId);
  }

  getCharacteristicInfo(accessories, accessoryId, serviceId, characteristicId) {
    return this.deviceManager.getCharacteristicInfo(accessories, accessoryId, serviceId, characteristicId);
  }

  async listHubs() {
    return await this.hubManager.listHubs();
  }

  async setClientInfo(clientInfo) {
    return await this.hubManager.setClientInfo(clientInfo);
  }

  async version() {
    return await this.hubManager.version();
  }

  async listRooms() {
    return await this.roomManager.listRooms();
  }

  getDevicesByRoom(accessories, roomId) {
    return this.roomManager.getDevicesByRoom(accessories, roomId);
  }

  async listScenarios() {
    return await this.scenarioManager.listScenarios();
  }

  async createScenario(config) {
    return await this.scenarioManager.createScenario(config);
  }

  async updateScenario(index, data) {
    return await this.scenarioManager.updateScenario(index, data);
  }

  async getScenario(index, expand) {
    return await this.scenarioManager.getScenario(index, expand);
  }

  async deleteScenario(index) {
    return await this.scenarioManager.deleteScenario(index);
  }

  async getFullSystemInfo() {
    return await this.systemManager.getFullSystemInfo();
  }
}

module.exports = Sprut;