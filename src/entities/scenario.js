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

      this.log.info(createResult, 'Scenario created successfully');

      if (createResult.error) {
        return {
          isSuccess: false,
          ...createResult.error,
        };
      }

      if (createResult.result) {
        // Handle both formats: direct result or nested scenario.create result
        if (createResult.result.scenario && createResult.result.scenario.create) {
          return {
            isSuccess: true,
            code: 0,
            message: 'Scenario created successfully',
            data: createResult.result.scenario.create,
          };
        } else {
          return createResult.result;
        }
      }

      return createResult;
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

      this.log.info(updateResult, 'Scenario updated successfully');

      if (updateResult.error) {
        return {
          isSuccess: false,
          ...updateResult.error,
        };
      }

      if (updateResult.result) {
        // Handle both formats: direct result or nested scenario.update result
        if (updateResult.result.scenario && updateResult.result.scenario.update) {
          return {
            isSuccess: true,
            code: 0,
            message: 'Scenario updated successfully',
            data: updateResult.result.scenario.update,
          };
        } else {
          return updateResult.result;
        }
      }

      return updateResult;
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
}

module.exports = ScenarioManager;