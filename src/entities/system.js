class SystemManager {
  constructor(hubManager, deviceManager, roomManager, scenarioManager) {
    this.hubManager = hubManager;
    this.deviceManager = deviceManager;
    this.roomManager = roomManager;
    this.scenarioManager = scenarioManager;
  }

  async getFullSystemInfo() {
    const results = await Promise.allSettled([
      this.hubManager.listHubs(),
      this.deviceManager.listAccessories(),
      this.roomManager.listRooms(),
      this.scenarioManager.listScenarios()
    ]);

    const systemInfo = {
      hubs: results[0].status === 'fulfilled' && results[0].value.isSuccess ? results[0].value.data : [],
      accessories: results[1].status === 'fulfilled' && results[1].value.isSuccess ? results[1].value.data : [],
      rooms: results[2].status === 'fulfilled' && results[2].value.isSuccess ? results[2].value.data : [],
      scenarios: results[3].status === 'fulfilled' && results[3].value.isSuccess ? results[3].value.data : [],
      controllableDevices: [],
      errors: []
    };

    // Add any errors that occurred
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const apiName = ['hubs', 'accessories', 'rooms', 'scenarios'][index];
        systemInfo.errors.push(`Failed to fetch ${apiName}: ${result.reason.message}`);
      }
    });

    // Generate controllable devices list
    if (systemInfo.accessories.length > 0) {
      systemInfo.controllableDevices = this.deviceManager.getControllableCharacteristics(systemInfo.accessories);
    }

    return systemInfo;
  }
}

module.exports = SystemManager;