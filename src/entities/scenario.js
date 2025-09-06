const Helpers = require('../utils/helpers');

class ScenarioManager {
  constructor(callMethod, ensureConnectionAndAuthMethod, logger) {
    this.call = callMethod;
    this.ensureConnectionAndAuth = ensureConnectionAndAuthMethod;
    this.log = logger;
  }

  async listScenarios() {
    await this.ensureConnectionAndAuth();

    try {
      const scenarioResult = await this.call({
        scenario: {
          list: {}
        }
      });

      return Helpers.handleApiResponse(
        scenarioResult,
        ["scenario", "list", "scenarios"],
        this.log,
        "Scenario list retrieved successfully"
      );
    } catch (error) {
      this.log.error("Error getting scenario list:", error);
      throw error;
    }
  }

  async getScenario(index, expand) {
    if (!index) {
      throw new Error("Scenario index must be provided");
    }

    await this.ensureConnectionAndAuth();

    try {
      const getResult = await this.call({
        scenario: {
          get: {
            index,
            ...(expand && { expand })
          }
        }
      });

      return Helpers.handleApiResponse(getResult, ["scenario", "get"], this.log, "Scenario retrieved successfully");
    } catch (error) {
      this.log.error("Error getting scenario:", error);
      throw error;
    }
  }

  async createScenario({ type = 'BLOCK', name = '', desc = '', onStart = true, active = true, sync = false, data = '' }) {
    await this.ensureConnectionAndAuth();

    try {
      const dataToSend = typeof data === 'object' ? JSON.stringify(data) : data;
      const createResult = await this.call({
        scenario: {
          create: {
            type,
            name,
            desc,
            onStart,
            active,
            sync,
            data: dataToSend,
          },
        },
      });

      return Helpers.handleApiResponse(
        createResult,
        ["scenario", "create"],
        this.log,
        "Scenario created successfully"
      );
    } catch (error) {
      this.log.error('Error creating scenario:', error);
      throw error;
    }
  }

  async updateScenario(index, data) {
    if (!index) {
      throw new Error('Scenario index must be provided');
    }

    if (!data) {
      throw new Error('Scenario data must be provided');
    }

    await this.ensureConnectionAndAuth();

    try {
      const dataToSend = typeof data === 'object' ? JSON.stringify(data) : data;
      const updateResult = await this.call({
        scenario: {
          update: {
            index,
            data: dataToSend,
          },
        },
      });

      return Helpers.handleApiResponse(
        updateResult,
        ["scenario", "update"],
        this.log,
        "Scenario updated successfully"
      );
    } catch (error) {
      this.log.error('Error updating scenario:', error);
      throw error;
    }
  }

  async deleteScenario(index) {
    if (!index) {
      throw new Error("Scenario index must be provided");
    }

    await this.ensureConnectionAndAuth();

    try {
      const deleteResult = await this.call({
        scenario: {
          delete: {
            index
          }
        }
      });

      return Helpers.handleApiResponse(
        deleteResult,
        ["scenario", "delete"],
        this.log,
        "Scenario deleted successfully"
      );
    } catch (error) {
      this.log.error("Error deleting scenario:", error);
      throw error;
    }
  }

  async runScenario(index) {
    if (!index) {
      throw new Error("Scenario index must be provided");
    }

    await this.ensureConnectionAndAuth();

    try {
      const runResult = await this.call({
        scenario: {
          run: {
            index
          }
        }
      });

      return Helpers.handleApiResponse(
        runResult,
        ["scenario", "run"],
        this.log,
        "Scenario executed successfully"
      );
    } catch (error) {
      this.log.error("Error running scenario:", error);
      throw error;
    }
  }
}

module.exports = ScenarioManager;