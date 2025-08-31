const Helpers = require('../utils/helpers');

class DeviceManager {
  constructor(callMethod, ensureConnectionAndAuthMethod, logger) {
    this.call = callMethod;
    this.ensureConnectionAndAuth = ensureConnectionAndAuthMethod;
    this.log = logger;
  }

  async listAccessories(expand = "services,characteristics") {
    await this.ensureConnectionAndAuth();

    try {
      const accessoryResult = await this.call({
        accessory: {
          list: {
            expand: expand
          }
        }
      });

      return Helpers.handleApiResponse(
        accessoryResult,
        ["accessory", "list", "accessories"],
        this.log,
        "Accessory list retrieved successfully"
      );
    } catch (error) {
      this.log.error("Error getting accessory list:", error);
      throw error;
    }
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

    if (!control || control.value === undefined) {
      throw new Error("control.value must be set");
    }
    
    const value = control.value;
    const valueType = control.valueType || Helpers.determineValueType(value);

    await this.ensureConnectionAndAuth();

    try {
      const controlValue = Helpers.createControlValue(value, valueType);

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
      throw error;
    }
  }

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

  getDeviceInfo(accessories, accessoryId) {
    if (!Array.isArray(accessories)) {
      return null;
    }
    
    return accessories.find(accessory => accessory.id === accessoryId) || null;
  }

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
}

module.exports = DeviceManager;