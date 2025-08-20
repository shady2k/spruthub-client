const WebSocket = require("ws");
const Queue = require("./queue");

class Sprut {
  constructor(opts) {
    const { wsUrl, sprutEmail, sprutPassword, serial, logger } = opts;
    this.log = logger;
    this.wsUrl = wsUrl;
    this.sprutEmail = sprutEmail;
    this.sprutPassword = sprutPassword;
    this.token = null;
    this.serial = serial;
    this.isConnected = false;
    this.idCounter = 1;
    this.queue = new Queue();
    this.isTerminated = false;

    if (!wsUrl || !sprutEmail || !sprutPassword || !serial) {
      throw new Error(
        "wsUrl, sprutEmail, sprutPassword, serial must be set as env variables"
      );
    }
    this.wsClient = new WebSocket(wsUrl);
    this.wsClient.on("open", () => this.handleConnection());
    this.wsClient.on("message", (data) => this.onMessage(data));
    this.wsClient.on("close", () => this.handleDisconnection());
    this.wsClient.on("error", (error) => this.handleError(error));
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
        callback(response); // Resolve the promise with the response
        this.queue.remove(id);
      }
    } catch (error) {
      this.log.error("Error parsing message:", error);
    }
  }

  handleConnection() {
    this.log.info("Spruthub connected!");
    this.isConnected = true;
    // Implement initial request logic here
  }

  handleDisconnection() {
    if (this.isTerminated) {
      this.log.info("Spruthub connection closed!");
      return;
    }
    this.log.info("Spruthub connection closed, trying to reconnect...");
    this.isConnected = false;

    // Delay before attempting to reconnect
    setTimeout(() => {
      this.reconnect();
    }, 5000); // 5 seconds delay
  }

  reconnect() {
    this.log.info("Attempting to reconnect...");
    this.wsClient = new WebSocket(this.wsUrl);
    this.wsClient.on("open", () => this.handleConnection());
    this.wsClient.on("message", (data) => this.onMessage(data));
    this.wsClient.on("close", () => this.handleDisconnection());
    this.wsClient.on("error", (error) => this.handleError(error));
  }

  handleError(error) {
    this.log.error("Spruthub error:", error);
  }

  async connected() {
    return new Promise((resolve) => {
      if (this.isConnected) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (this.isConnected) {
            resolve();
            clearInterval(interval);
          }
        }, 100);
      }
    });
  }

  async ensureConnectionAndAuthentication() {
    if (!this.isConnected) {
      throw new Error("Not connected");
    }
    if (!this.token) {
      const authResult = await this.auth();
      if (authResult.isError) {
        throw new Error("Authentication failed.");
      } else {
        this.token = authResult.result.token;
      }
    }
  }

  async call(json) {
    return new Promise((resolve, reject) => {
      const id = this.generateNextId();
      const payload = {
        jsonrpc: "2.0",
        params: json,
        id,
        token: this.token,
        serial: this.serial,
      };

      if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
        this.wsClient.send(JSON.stringify(payload), (error) => {
          if (error) {
            reject(error);
          } else {
            this.queue.add(id, (response) => {
              if (response.error && response.error.code === -666003) {
                // Token is not valid, attempt retry with fresh token
                this.retryCallWithFreshToken(json, resolve, reject);
              } else {
                resolve(response);
              }
            });
          }
        });
      } else {
        this.log.error("WebSocket is not open. Cannot send message.");
        reject(new Error("WebSocket is not open"));
      }
    });
  }

  async retryCallWithFreshToken(json, resolve, reject) {
    try {
      const authResult = await this.auth();
      if (authResult.isError) {
        throw new Error("Authentication failed.");
      }
      this.token = authResult.result.token;
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
    return new Promise((resolve, reject) => {
      this.isTerminated = true;
      if (this.wsClient) {
        // Listen for the 'close' event
        this.wsClient.once("close", () => {
          // Once the 'close' event is emitted, resolve the promise
          resolve();
        });

        // Attempt to close the WebSocket connection
        try {
          this.wsClient.close();
        } catch (error) {
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

  _getNestedProperty(obj, path, defaultValue) {
    return path.reduce(
      (acc, key) => (acc && acc[key] ? acc[key] : defaultValue),
      obj
    );
  }

  async auth() {
    return new Promise((resolve, reject) => {
      // Step 1: Initial auth request
      this.call({
        account: {
          auth: {
            params: [],
          },
        },
      })
        .then((authCall) => {
          if (
            this._getNestedProperty(authCall, [
              "result",
              "account",
              "auth",
              "status",
            ]) !== "ACCOUNT_RESPONSE_SUCCESS" ||
            this._getNestedProperty(authCall, [
              "result",
              "account",
              "auth",
              "question",
              "type",
            ]) !== "QUESTION_TYPE_EMAIL"
          ) {
            reject(new Error("Expected email question type."));
          } else {
            // Step 2: Send email
            this.call({
              account: {
                answer: {
                  data: this.sprutEmail,
                },
              },
            })
              .then((emailCall) => {
                if (
                  this._getNestedProperty(emailCall, [
                    "result",
                    "account",
                    "answer",
                    "question",
                    "type",
                  ]) !== "QUESTION_TYPE_PASSWORD"
                ) {
                  reject(new Error("Expected password question type."));
                } else {
                  // Step 3: Send password
                  this.call({
                    account: {
                      answer: {
                        data: this.sprutPassword,
                      },
                    },
                  })
                    .then((passwordCall) => {
                      if (
                        this._getNestedProperty(passwordCall, [
                          "result",
                          "account",
                          "answer",
                          "status",
                        ]) !== "ACCOUNT_RESPONSE_SUCCESS"
                      ) {
                        reject(new Error("Authentication failed."));
                      } else {
                        resolve({
                          isError: false,
                          result: {
                            token: passwordCall.result.account.answer.token,
                          },
                        });
                      }
                    })
                    .catch(reject);
                }
              })
              .catch(reject);
          }
        })
        .catch(reject);
    });
  }

  /**
   * Execute a command on a specific device characteristic
   * @param {string} command - Command to execute (currently supports "update")
   * @param {Object} params - Command parameters
   * @param {number} params.accessoryId - Device accessory ID
   * @param {number} params.serviceId - Service ID within the accessory
   * @param {number} params.characteristicId - Characteristic ID within the service
   * @param {Object} params.control - Control object
   * @param {*} params.control.value - Value to set (boolean, number, or string)
   * @param {string} [params.control.valueType] - Explicit value type ('bool', 'int', 'float', 'string')
   * @returns {Promise<Object>} Response indicating success or failure
   */
  async execute(command, { accessoryId, serviceId, characteristicId, control }) {
    // Check if the command is allowed
    const commands = ["update"];
    if (!commands.includes(command)) {
      throw new Error("Command not allowed");
    }  

    // Validate parameters
    if (!accessoryId || !serviceId || !characteristicId) {
      throw new Error("accessoryId, serviceId, characteristicId must be set");
    }

    if (!control || control.value === undefined) {
      throw new Error("control.value must be set");
    }
    
    const value = control.value;
    const valueType = control.valueType || this._determineValueType(value);

    await this.ensureConnectionAndAuthentication();

    // Execute the command
    try {
      const controlValue = {};
      
      // Set the appropriate value type based on input
      switch (valueType) {
        case 'bool':
        case 'boolean':
          controlValue.boolValue = Boolean(value);
          break;
        case 'int':
        case 'integer':
        case 'number':
          controlValue.intValue = parseInt(value, 10);
          break;
        case 'float':
        case 'double':
          controlValue.floatValue = parseFloat(value);
          break;
        case 'string':
        default:
          controlValue.stringValue = String(value);
          break;
      }

      const updateResult = await this.call({
        characteristic: {
          update: {
            aId: accessoryId,
            sId: serviceId,
            cId: characteristicId,
            control: {
              value: controlValue
            }
          }
        }
      });

      this.log.info(updateResult, "Command executed successfully");

      if (updateResult.error) {
        return {
          isSuccess: false,
          ...updateResult.error,
        };
      }

      if (updateResult.result) {
        return {
          isSuccess: true,
          code: 0,
          message: "Success",
        };
      }

      return updateResult;
    } catch (error) {
      this.log.error("Error executing command:", error);
      throw error; // Rethrow the error to be caught by the caller
    }
  }

  _determineValueType(value) {
    if (typeof value === 'boolean') {
      return 'bool';
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'float';
    }
    return 'string';
  }

  /**
   * Filter accessories by room ID
   * @param {Array<Object>} accessories - Array of accessory objects
   * @param {number} roomId - Room ID to filter by
   * @returns {Array<Object>} Filtered accessories in the specified room
   */
  getDevicesByRoom(accessories, roomId) {
    if (!Array.isArray(accessories)) {
      return [];
    }
    return accessories.filter(accessory => accessory.roomId === roomId);
  }

  /**
   * Extract all writable characteristics from accessories for control purposes
   * @param {Array<Object>} accessories - Array of accessory objects with services and characteristics
   * @returns {Array<Object>} Array of controllable characteristics with metadata
   */
  getControllableCharacteristics(accessories) {
    const controllable = [];
    
    if (!Array.isArray(accessories)) {
      return controllable;
    }

    accessories.forEach(accessory => {
      if (!accessory.services || !Array.isArray(accessory.services)) {
        return;
      }

      accessory.services.forEach(service => {
        if (!service.characteristics || !Array.isArray(service.characteristics)) {
          return;
        }

        service.characteristics.forEach(characteristic => {
          if (characteristic.control && characteristic.control.write) {
            controllable.push({
              accessoryId: accessory.id,
              accessoryName: accessory.name,
              serviceId: service.sId,
              serviceName: service.name,
              serviceType: service.type,
              characteristicId: characteristic.cId,
              characteristicName: characteristic.control.name,
              characteristicType: characteristic.control.type,
              currentValue: characteristic.control.value,
              writable: characteristic.control.write,
              readable: characteristic.control.read,
              hasEvents: characteristic.control.events,
              validValues: characteristic.control.validValues || null,
              minValue: characteristic.control.minValue || null,
              maxValue: characteristic.control.maxValue || null,
              minStep: characteristic.control.minStep || null
            });
          }
        });
      });
    });

    return controllable;
  }

  /**
   * Get detailed information for a specific device
   * @param {Array<Object>} accessories - Array of accessory objects
   * @param {number} accessoryId - Device accessory ID
   * @returns {Object|null} Device information object or null if not found
   */
  getDeviceInfo(accessories, accessoryId) {
    if (!Array.isArray(accessories)) {
      return null;
    }
    
    return accessories.find(accessory => accessory.id === accessoryId) || null;
  }

  /**
   * Get comprehensive information about a specific characteristic
   * @param {Array<Object>} accessories - Array of accessory objects
   * @param {number} accessoryId - Device accessory ID
   * @param {number} serviceId - Service ID
   * @param {number} characteristicId - Characteristic ID
   * @returns {Object|null} Detailed characteristic info with device and service context
   */
  getCharacteristicInfo(accessories, accessoryId, serviceId, characteristicId) {
    const device = this.getDeviceInfo(accessories, accessoryId);
    if (!device || !device.services) {
      return null;
    }

    const service = device.services.find(s => s.sId === serviceId);
    if (!service || !service.characteristics) {
      return null;
    }

    const characteristic = service.characteristics.find(c => c.cId === characteristicId);
    if (!characteristic) {
      return null;
    }

    return {
      device: {
        id: device.id,
        name: device.name,
        manufacturer: device.manufacturer,
        model: device.model,
        online: device.online,
        roomId: device.roomId
      },
      service: {
        id: service.sId,
        name: service.name,
        type: service.type
      },
      characteristic: {
        id: characteristic.cId,
        name: characteristic.control?.name || 'Unknown',
        type: characteristic.control?.type || 'Unknown',
        value: characteristic.control?.value || null,
        writable: characteristic.control?.write || false,
        readable: characteristic.control?.read || false,
        validValues: characteristic.control?.validValues || null
      }
    };
  }

  /**
   * Set client information for the WebSocket connection
   * @param {Object} clientInfo - Client information object
   * @param {string} clientInfo.id - Client UUID (auto-generated if not provided)
   * @param {string} clientInfo.name - Client name
   * @param {string} clientInfo.type - Client type (e.g., CLIENT_DESKTOP)
   * @param {string} clientInfo.auth - Authentication string
   * @returns {Promise<Object>} Response object with success status
   */
  async setClientInfo(clientInfo = {}) {
    await this.ensureConnectionAndAuthentication();

    const defaultClientInfo = {
      id: require('crypto').randomUUID(),
      name: "SprutHub Node.js Client",
      type: "CLIENT_DESKTOP",
      auth: ""
    };

    const finalClientInfo = { ...defaultClientInfo, ...clientInfo };

    try {
      const clientResult = await this.call({
        server: {
          clientInfo: finalClientInfo
        }
      });

      this.log.info(clientResult, "Client info set successfully");

      if (clientResult.error) {
        return {
          isSuccess: false,
          ...clientResult.error,
        };
      }

      return {
        isSuccess: true,
        code: 0,
        message: "Success",
        data: clientResult.result
      };
    } catch (error) {
      this.log.error("Error setting client info:", error);
      throw error;
    }
  }

  /**
   * Get list of all Sprut hubs in the system
   * @returns {Promise<Object>} Response with hub information including versions, platform details, and status
   */
  async listHubs() {
    await this.ensureConnectionAndAuthentication();

    try {
      const hubResult = await this.call({
        hub: {
          list: {}
        }
      });

      this.log.info(hubResult, "Hub list retrieved successfully");

      if (hubResult.error) {
        return {
          isSuccess: false,
          ...hubResult.error,
        };
      }

      if (hubResult.result) {
        return {
          isSuccess: true,
          code: 0,
          message: "Success",
          data: hubResult.result.hub.list.hubs,
        };
      }

      return hubResult;
    } catch (error) {
      this.log.error("Error getting hub list:", error);
      throw error;
    }
  }

  /**
   * Get list of all accessories (smart home devices) with their services and characteristics
   * @param {string} expand - Comma-separated list of properties to expand (default: "services,characteristics")
   * @returns {Promise<Object>} Response with detailed device information including controllable characteristics
   */
  async listAccessories(expand = "services,characteristics") {
    await this.ensureConnectionAndAuthentication();

    try {
      const accessoryResult = await this.call({
        accessory: {
          list: {
            expand: expand
          }
        }
      });

      this.log.info(accessoryResult, "Accessory list retrieved successfully");

      if (accessoryResult.error) {
        return {
          isSuccess: false,
          ...accessoryResult.error,
        };
      }

      if (accessoryResult.result) {
        return {
          isSuccess: true,
          code: 0,
          message: "Success",
          data: accessoryResult.result.accessory.list.accessories,
        };
      }

      return accessoryResult;
    } catch (error) {
      this.log.error("Error getting accessory list:", error);
      throw error;
    }
  }

  /**
   * Get list of all rooms in the smart home system
   * @returns {Promise<Object>} Response with room information including IDs, names, and visibility
   */
  async listRooms() {
    await this.ensureConnectionAndAuthentication();

    try {
      const roomResult = await this.call({
        room: {
          list: {}
        }
      });

      this.log.info(roomResult, "Room list retrieved successfully");

      if (roomResult.error) {
        return {
          isSuccess: false,
          ...roomResult.error,
        };
      }

      if (roomResult.result) {
        return {
          isSuccess: true,
          code: 0,
          message: "Success",
          data: roomResult.result.room.list.rooms,
        };
      }

      return roomResult;
    } catch (error) {
      this.log.error("Error getting room list:", error);
      throw error;
    }
  }

  async version() {
    await this.ensureConnectionAndAuthentication();

    // Execute the command
    try {
      const versionResult = await this.call({
        server: {
          version: {},
        },
      });

      this.log.info(versionResult, "Command executed successfully");

      if (versionResult.error) {
        return {
          isSuccess: false,
          ...versionResult.error,
        };
      }

      if (versionResult.result) {
        return {
          isSuccess: true,
          code: 0,
          message: "Success",
          data: versionResult.result.server.version,
        };
      }

      return versionResult;
    } catch (error) {
      this.log.error("Error executing command:", error);
      throw error; // Rethrow the error to be caught by the caller
    }
  }

  /**
   * Get comprehensive system information including hubs, devices, rooms, and controllable characteristics
   * Performs parallel API calls for optimal performance
   * @returns {Promise<Object>} Complete system state with hubs, accessories, rooms, controllable devices, and any errors
   */
  async getFullSystemInfo() {
    const results = await Promise.allSettled([
      this.listHubs(),
      this.listAccessories(),
      this.listRooms()
    ]);

    const systemInfo = {
      hubs: results[0].status === 'fulfilled' && results[0].value.isSuccess ? results[0].value.data : [],
      accessories: results[1].status === 'fulfilled' && results[1].value.isSuccess ? results[1].value.data : [],
      rooms: results[2].status === 'fulfilled' && results[2].value.isSuccess ? results[2].value.data : [],
      controllableDevices: [],
      errors: []
    };

    // Add any errors that occurred
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const apiName = ['hubs', 'accessories', 'rooms'][index];
        systemInfo.errors.push(`Failed to fetch ${apiName}: ${result.reason.message}`);
      }
    });

    // Generate controllable devices list
    if (systemInfo.accessories.length > 0) {
      systemInfo.controllableDevices = this.getControllableCharacteristics(systemInfo.accessories);
    }

    return systemInfo;
  }
}

module.exports = Sprut;