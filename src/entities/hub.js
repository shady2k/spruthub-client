const Helpers = require('../utils/helpers');

class HubManager {
  constructor(callMethod, ensureConnectionAndAuthMethod, logger) {
    this.call = callMethod;
    this.ensureConnectionAndAuth = ensureConnectionAndAuthMethod;
    this.log = logger;
  }

  async listHubs() {
    await this.ensureConnectionAndAuth();

    try {
      const hubResult = await this.call({
        hub: {
          list: {}
        }
      });

      return Helpers.handleApiResponse(
        hubResult,
        ["hub", "list", "hubs"],
        this.log,
        "Hub list retrieved successfully"
      );
    } catch (error) {
      this.log.error("Error getting hub list:", error);
      throw error;
    }
  }

  async setClientInfo(clientInfo = {}) {
    await this.ensureConnectionAndAuth();

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

      return Helpers.handleApiResponse(
        clientResult,
        [],
        this.log,
        "Client info set successfully"
      );
    } catch (error) {
      this.log.error("Error setting client info:", error);
      throw error;
    }
  }

  async version() {
    await this.ensureConnectionAndAuth();

    try {
      const versionResult = await this.call({
        server: {
          version: {},
        },
      });

      return Helpers.handleApiResponse(
        versionResult,
        ["server", "version"],
        this.log,
        "Version retrieved successfully"
      );
    } catch (error) {
      this.log.error("Error getting version:", error);
      throw error;
    }
  }
}

module.exports = HubManager;