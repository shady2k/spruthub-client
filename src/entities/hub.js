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
      const hubResult = await this.call({
        hub: {
          list: {}
        }
      });

      const response = Helpers.handleApiResponse(
        hubResult,
        ["hub", "list", "hubs"],
        this.log,
        "Hub list retrieved successfully"
      );

      if (response.isSuccess && response.data && response.data.length > 0) {
        const hub = response.data[0];
        const versionData = {
          version: hub.version?.current?.version || hub.version?.version,
          revision: hub.version?.current?.revision || hub.version?.revision,
          template: hub.version?.current?.template,
          hardware: hub.version?.current?.hardware,
          branch: hub.version?.branch,
          platform: hub.platform,
          name: hub.name,
          manufacturer: hub.manufacturer,
          model: hub.model,
          serial: hub.serial,
          owner: hub.owner,
          lang: hub.lang,
          online: hub.online,
          lastSeen: hub.lastSeen,
          discovery: hub.discovery
        };

        return {
          isSuccess: true,
          code: 0,
          message: "Version retrieved successfully",
          data: versionData
        };
      } else {
        return {
          isSuccess: false,
          code: -1,
          message: "No hubs found",
          data: null
        };
      }
    } catch (error) {
      this.log.error("Error getting version:", error);
      throw error;
    }
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
}

module.exports = HubManager;