/**
 * System-related method schemas (high-level aggregations)
 */

const systemMethods = {
  'system.getFullInfo': {
    description: 'Get complete system information including hubs, devices, rooms, and scenarios',
    category: 'system',
    method: 'system.getFullInfo',
    rest: { method: 'GET', path: '/system/full-info' },
    params: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    result: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean' },
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            hubs: {
              type: 'array',
              description: 'All hubs in the system'
            },
            accessories: {
              type: 'array',
              description: 'All accessories/devices with full details',
              items: { $ref: '#/definitions/Accessory' }
            },
            rooms: {
              type: 'array',
              description: 'All rooms'
            },
            scenarios: {
              type: 'array',
              description: 'All scenarios',
              items: { $ref: '#/definitions/Scenario' }
            },
            controllableDevices: {
              type: 'array',
              description: 'Filtered list of controllable characteristics',
              items: { $ref: '#/definitions/ControllableCharacteristic' }
            }
          }
        }
      }
    },
    examples: [
      {
        description: 'Get complete system information',
        request: {
          params: {}
        }
      }
    ]
  },

  'server.version': {
    description: 'Get version information',
    category: 'system', 
    method: 'server.version',
    rest: { method: 'GET', path: '/server/version' },
    params: {
      type: 'object',
      properties: {
        server: {
          type: 'object',
          properties: {
            version: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false
    },
    result: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean' },
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            revision: { type: 'number' },
            build: { type: 'string' },
            platform: { type: 'string' }
          }
        }
      }
    },
    examples: [
      {
        description: 'Get system version',
        request: {
          params: {}
        }
      }
    ]
  }
};

module.exports = systemMethods;