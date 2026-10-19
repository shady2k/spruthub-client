const { EventEmitter } = require('events');
const WebSocketManager = require('./websocket');
const AuthManager = require('./auth');
const Queue = require('../queue');
const DeviceManager = require('../entities/device');
const HubManager = require('../entities/hub');
const RoomManager = require('../entities/room');
const ScenarioManager = require('../entities/scenario');
const LogManager = require('../entities/log');
const SchemaManager = require('../schemas');
const enhancedMethods = require('../enhanced');
const ParameterValidator = require('../utils/parameterValidator');

class Sprut extends EventEmitter {
  constructor(opts) {
    super();
    this.closing = false;
    const { 
      wsUrl, 
      sprutEmail, 
      sprutPassword, 
      serial, 
      logger,
      // Validation options
      enableParameterValidation = true,
      strictValidation = false,
      // Timeout options
      defaultTimeout = 5000
    } = opts;
    
    this.log = logger;
    this.serial = serial;
    this.idCounter = 1;
    this.queue = new Queue();
    this.enhancedMethods = enhancedMethods;
    
    // Validation configuration
    this.enableParameterValidation = enableParameterValidation;
    this.strictValidation = strictValidation;
    this.defaultTimeout = defaultTimeout;
    
    // Initialize parameter validator
    this.parameterValidator = new ParameterValidator(logger);

    if (!wsUrl || !sprutEmail || !sprutPassword || !serial) {
      throw new Error(
        "wsUrl, sprutEmail, sprutPassword, serial must be set as env variables"
      );
    }

    // Initialize WebSocket manager
    this.wsManager = new WebSocketManager(wsUrl, logger, opts.reconnect);
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

    this.logManager = new LogManager(
      (json) => this.call(json),
      () => this.ensureConnectionAndAuthentication(),
      logger
    );

    // Start connection
    this.wsManager.connect();
  }

  onMessage(data) {
    try {
      const response = JSON.parse(data);
      if (!response || typeof response !== "object") return;
      
      // Handle streaming events separately from request/response pairs
      if (response.event) {
        this.handleStreamingEvent(response);
        return;
      }
      
      // Handle regular JSON-RPC responses
      this.log.debug({ id: typeof response.id === "number" ? response.id : undefined, hasError: !!response.error }, "Received response metadata");
      const id = response.id;
      const callback = this.queue.get(id);
      if (callback) {
        callback(response);
        this.queue.remove(id);
      }
    } catch (error) {
      this.log.warn("Invalid WebSocket message ignored");
    }
  }

  handleStreamingEvent(eventData) {
    // this.log.debug(eventData, "Received streaming event:");
    
    // Handle log streaming events
    if (eventData.event && eventData.event.log) {
      if (this.logManager) {
        this.logManager.handleLogEvent(eventData);
      }
      return;
    }
    
    // Handle other future streaming events here
  }

  handleConnection() {
    this.log.info("WebSocket connection established");
    this.emit("connected");
  }

  handleDisconnection() {
    this.log.info("WebSocket connection closed");
    this.authManager.clearToken();
    this.queue.failAll();
    this.emit("disconnected");
    
    // Clean up any active log subscriptions
    if (this.logManager) {
      this.logManager.cleanup();
    }
  }

  handleError(_error) {
    this.log.error("WebSocket transport error occurred");
  }

  async connected(timeout = this.defaultTimeout) {
    if (this.closing) throw new Error("Client closed");
    if (this.wsManager.isConnected) return;
    await new Promise((resolve, reject) => {
      const done = () => { cleanup(); resolve(); };
      const closed = () => { cleanup(); reject(new Error("Client closed")); };
      const timer = setTimeout(() => { cleanup(); reject(new Error("Connection timeout")); }, timeout);
      const cleanup = () => { clearTimeout(timer); this.off("connected", done); this.off("closed", closed); };
      this.once("connected", done);
      this.once("closed", closed);
    });
  }

  // Durable collector; ordinary subscribeLogs remains a single-connection API.
  watchLogs(onRecord, options) {
    const LogWatcher = require('../entities/log-watcher');
    return new LogWatcher(this, onRecord, options);
  }

  async ensureConnectionAndAuthentication() {
    if (this.closing) throw new Error("Client closed");
    if (!this.wsManager.isConnected) {
      throw new Error("Not connected");
    }
    await this.authManager.ensureAuthenticated();
  }

  async call(json, timeout = null, retryAuth = true) {
    return new Promise((resolve, reject) => {
      const id = this.generateNextId();
      const payload = {
        jsonrpc: "2.0",
        params: json,
        id,
        token: this.authManager.getToken(),
        serial: this.serial,
      };

      // Use provided timeout or default
      const requestTimeout = timeout || this.defaultTimeout;

      if (this.wsManager.isOpen()) {
        this.queue.add(id, (response) => {
          if (response.error && response.error.code === -666003 && retryAuth && !json.account) {
            // Token is not valid, attempt one retry with a fresh token.
            this.retryCallWithFreshToken(json, resolve, reject);
          } else {
            resolve(response);
          }
        }, requestTimeout);
        this.wsManager.send(JSON.stringify(payload)).catch(error => {
          this.queue.remove(id);
          reject(error);
        });
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
      const retryResponse = await this.call(json, null, false);
      resolve(retryResponse);
    } catch (error) {
      reject(error);
    }
  }

  generateNextId() {
    return this.idCounter++;
  }

  close() {
    if (!this.closePromise) {
      this.closing = true;
      // Assign before emitting closed, so reentrant callers share the same promise.
      this.closePromise = Promise.resolve().then(() => this.performClose());
    }
    return this.closePromise;
  }

  async performClose() {
    this.authManager.cancelAuthentication();
    this.emit("closed");
    this.queue.failAll();
    try {
      if (this.wsManager.isOpen()) {
        const subscriptions = this.logManager.getActiveSubscriptions();
        await Promise.all(subscriptions.map(({ uuid }) =>
          // Shutdown must never initiate a new authentication flow.
          this.call({ log: { unsubscribe: { uuid } } }, this.defaultTimeout, false).catch(() => {})));
      }
    } finally {
      try {
        await this.wsManager.close();
      } finally {
        this.queue.failAll();
        this.logManager.cleanup();
        this.authManager.clearToken();
      }
    }
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

  async getLogs(count) {
    return await this.logManager.getLogs(count);
  }

  async subscribeLogs(onLogEvent) {
    return await this.logManager.subscribeLogs(onLogEvent);
  }

  async unsubscribeLogs(uuid) {
    return await this.logManager.unsubscribeLogs(uuid);
  }

  async unsubscribeAllLogs() {
    return await this.logManager.unsubscribeAllLogs();
  }

  getActiveLogSubscriptions() {
    return this.logManager.getActiveSubscriptions();
  }

  async listRooms() {
    return await this.roomManager.listRooms();
  }

  async getRoom(roomId) {
    return await this.roomManager.getRoom(roomId);
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

  async runScenario(index) {
    return await this.scenarioManager.runScenario(index);
  }

  

  // Schema methods
  getSchema() {
    return SchemaManager.schema;
  }

  getAvailableMethods() {
    return SchemaManager.getAvailableMethods();
  }

  getMethodSchema(methodName) {
    return SchemaManager.getMethodSchema(methodName);
  }

  getMethodsByCategory(category) {
    return SchemaManager.getMethodsByCategory(category);
  }

  getCategories() {
    return SchemaManager.getCategories();
  }

  getTypeDefinition(typeName) {
    return SchemaManager.getTypeDefinition(typeName);
  }

  // Generic method caller - executes any JSON-RPC method dynamically
  async callMethod(methodName, requestData = {}) {
    await this.ensureConnectionAndAuthentication();
    
    // Get the method schema to understand the expected parameter structure
    const methodSchema = this.getMethodSchema(methodName);
    if (!methodSchema) {
      throw new Error(`Method ${methodName} not found in schema`);
    }

    // Check if it's an enhanced method
    if (methodSchema.enhanced) {
      const implementation = this.enhancedMethods[methodName];
      if (!implementation) {
        throw new Error(`Implementation for enhanced method ${methodName} not found`);
      }
      // The implementation receives the client instance and params
      return implementation(this, requestData);
    }

    // Build parameters dynamically from schema structure
    let params = this.buildParamsFromSchema(methodSchema.params, requestData);

    // Parameter validation if enabled
    if (this.enableParameterValidation) {
      const validation = this.parameterValidator.validateAndCoerce(methodSchema, params);
      
      if (!validation.isValid) {
        const errorMessage = this.parameterValidator.formatValidationErrors(validation.errors);
        this.log.warn(`Parameter validation failed for ${methodName}:`, errorMessage);
        
        if (this.strictValidation) {
          return {
            isSuccess: false,
            code: -32602,
            message: `Parameter validation failed: ${errorMessage}`,
            data: { validationErrors: validation.errors }
          };
        }
      }
      
      // Use coerced parameters even if validation had warnings
      params = validation.coercedData;
      
      if (validation.errors.length > 0 && !this.strictValidation) {
        this.log.debug(`Parameter coercion applied for ${methodName}:`, validation.errors);
      }
    }

    try {
      const timeout = this.defaultTimeout;
      const result = await this.call(params, timeout);
      
      // Wrap JSON-RPC response in standardized format
      if (result.error) {
        return {
          isSuccess: false,
          code: result.error.code || -1,
          message: result.error.message || 'Unknown error',
          data: result.error.data || {}
        };
      }
      
      if (result.result) {
        // Extract the actual data from the nested JSON-RPC response
        const [category, action] = methodName.split('.');
        let extractedData = result.result;
        
        // Navigate through the nested structure to get the actual data
        if (extractedData[category] && extractedData[category][action]) {
          extractedData = extractedData[category][action];
        }
        
        return {
          isSuccess: true,
          code: 0,
          message: 'Success',
          data: extractedData
        };
      }
      
      return {
        isSuccess: false,
        code: -1,
        message: 'Unexpected response format',
        data: {}
      };
    } catch (error) {
      this.log.error(`Error calling ${methodName}:`, error);
      throw error;
    }
  }

  // Build parameters dynamically based on schema
  buildParamsFromSchema(schemaParams, requestData, flatRequestData = null) {
    if (!schemaParams || !schemaParams.properties) {
      return {};
    }

    // Keep reference to flat data for finding path/query params
    if (flatRequestData === null) {
      flatRequestData = requestData;
    }

    const params = {};
    
    // Iterate through the schema properties to build the parameter structure
    for (const [key, value] of Object.entries(schemaParams.properties)) {
      if (value.type === 'object' && value.properties) {
        params[key] = this.buildParamsFromSchema(value, requestData[key] || {}, flatRequestData);
      } else {
        // For leaf values, first try nested data, then fall back to flat data
        if (requestData[key] !== undefined) {
          params[key] = requestData[key];
        } else if (flatRequestData[key] !== undefined) {
          params[key] = flatRequestData[key];
        }
      }
    }

    return params;
  }
}

module.exports = Sprut;