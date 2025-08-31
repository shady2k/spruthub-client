/**
 * Device-related type definitions for SprutHub API
 */

const deviceTypes = {
  // Characteristic control definition
  CharacteristicControl: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      type: { type: 'string' },
      value: {
        oneOf: [
          { type: 'object', properties: { boolValue: { type: 'boolean' } } },
          { type: 'object', properties: { intValue: { type: 'integer' } } },
          { type: 'object', properties: { stringValue: { type: 'string' } } },
          { type: 'object', properties: { floatValue: { type: 'number' } } }
        ]
      },
      read: { type: 'boolean' },
      write: { type: 'boolean' },
      events: { type: 'boolean' },
      hidden: { type: 'boolean' },
      visible: { type: 'boolean' },
      order: { type: 'number' },
      maxLen: { type: 'number' },
      minValue: { type: 'number' },
      maxValue: { type: 'number' },
      minStep: { type: 'number' },
      validValues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            checked: { type: 'boolean' },
            value: {
              oneOf: [
                { type: 'object', properties: { boolValue: { type: 'boolean' } } },
                { type: 'object', properties: { intValue: { type: 'integer' } } },
                { type: 'object', properties: { stringValue: { type: 'string' } } }
              ]
            },
            key: { type: 'string' },
            name: { type: 'string' }
          }
        }
      }
    }
  },

  // Characteristic definition
  Characteristic: {
    type: 'object',
    properties: {
      aId: { type: 'number' },
      sId: { type: 'number' },
      cId: { type: 'number' },
      linkProcessing: { type: 'number' },
      hasOptions: { type: 'boolean' },
      hasLinks: { type: 'boolean' },
      statusVisible: { type: 'boolean' },
      notify: { type: 'boolean' },
      option: { type: 'boolean' },
      control: { $ref: '#/definitions/CharacteristicControl' }
    },
    required: ['aId', 'sId', 'cId']
  },

  // Service definition
  Service: {
    type: 'object',
    properties: {
      aId: { type: 'number' },
      sId: { type: 'number' },
      order: { type: 'number' },
      visible: { type: 'boolean' },
      system: { type: 'boolean' },
      grid: {
        type: 'object',
        properties: {
          order: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      },
      name: { type: 'string' },
      type: { type: 'string' },
      characteristics: {
        type: 'array',
        items: { $ref: '#/definitions/Characteristic' }
      }
    },
    required: ['aId', 'sId', 'name', 'type']
  },

  // Accessory/Device definition
  Accessory: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      endpoint: { type: 'number' },
      lastUpdate: { type: 'number' },
      roomId: { type: 'number' },
      online: { type: 'boolean' },
      virtual: { type: 'boolean' },
      hasOptions: { type: 'boolean' },
      hasRelatives: { type: 'boolean' },
      hasScenarios: { type: 'boolean' },
      name: { type: 'string' },
      manufacturer: { type: 'string' },
      model: { type: 'string' },
      manufacturerId: { type: 'string' },
      modelId: { type: 'string' },
      serial: { type: 'string' },
      firmware: { type: 'string' },
      deviceId: { type: 'string' },
      controllerIndex: { type: 'string' },
      services: {
        type: 'array',
        items: { $ref: '#/definitions/Service' }
      }
    },
    required: ['id', 'name', 'online']
  },

  // Controllable characteristic info (helper type)
  ControllableCharacteristic: {
    type: 'object',
    properties: {
      accessoryId: { type: 'number' },
      accessoryName: { type: 'string' },
      serviceId: { type: 'number' },
      serviceName: { type: 'string' },
      serviceType: { type: 'string' },
      characteristicId: { type: 'number' },
      characteristicName: { type: 'string' },
      characteristicType: { type: 'string' },
      currentValue: {},
      writable: { type: 'boolean' },
      readable: { type: 'boolean' },
      hasEvents: { type: 'boolean' },
      validValues: { type: 'array' },
      minValue: { type: 'number' },
      maxValue: { type: 'number' },
      minStep: { type: 'number' }
    }
  }
};

module.exports = deviceTypes;