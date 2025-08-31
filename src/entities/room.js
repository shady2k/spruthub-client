const Helpers = require('../utils/helpers');

class RoomManager {
  constructor(callMethod, ensureConnectionAndAuthMethod, logger) {
    this.call = callMethod;
    this.ensureConnectionAndAuth = ensureConnectionAndAuthMethod;
    this.log = logger;
  }

  async listRooms() {
    await this.ensureConnectionAndAuth();

    try {
      const roomResult = await this.call({
        room: {
          list: {}
        }
      });

      return Helpers.handleApiResponse(
        roomResult,
        ["room", "list", "rooms"],
        this.log,
        "Room list retrieved successfully"
      );
    } catch (error) {
      this.log.error("Error getting room list:", error);
      throw error;
    }
  }

  getDevicesByRoom(accessories, roomId) {
    if (!Array.isArray(accessories)) {
      return [];
    }
    return accessories.filter(accessory => accessory.roomId === roomId);
  }
}

module.exports = RoomManager;