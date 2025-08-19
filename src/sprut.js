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

    if (!control && control.value !== true && control.value !== false) {
      throw new Error("control.value must be set");
    }
    
    const value = control.value;

    await this.ensureConnectionAndAuthentication();

    // Execute the command
    try {
      const updateResult = await this.call({
        characteristic: {
          update: {
            aId: accessoryId,
            sId: serviceId,
            cId: characteristicId,
            control: {
              value: {
                boolValue: value
              }
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
}

module.exports = Sprut;