/**
 * Accessory/Device-related JSON-RPC method schemas
 */

const accessoryMethods = {
  'accessory.list': {
    description: 'List all accessories (smart devices) with their services and characteristics',
    category: 'accessory',
    method: 'accessory.list',
    rest: { method: 'GET', path: '/accessories' },
    params: {
      type: 'object',
      properties: {
        accessory: {
          type: 'object',
          properties: {
            list: {
              type: 'object',
              properties: {
                expand: { 
                  type: 'string',
                  description: 'Comma-separated list of properties to expand',
                  default: 'services,characteristics'
                }
              },
              additionalProperties: false
            }
          },
          required: ['list'],
          additionalProperties: false
        }
      },
      required: ['accessory'],
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
            accessories: {
              type: 'array',
              items: { $ref: '#/definitions/Accessory' }
            }
          }
        }
      }
    },
    examples: [
      {
        description: 'List all accessories with services and characteristics',
        request: {
          params: {
            accessory: {
              list: {
                expand: 'services,characteristics'
              }
            }
          }
        }
      },
      {
        description: 'List accessories without expanding details',
        request: {
          params: {
            accessory: {
              list: {}
            }
          }
        }
      }
    ]
  },

  'characteristic.update': {
    description: 'Update a characteristic value on a device',
    category: 'accessory',
    method: 'characteristic.update',
    rest: { method: 'PATCH', path: '/characteristics' },
    params: {
      type: 'object',
      properties: {
        characteristic: {
          type: 'object',
          properties: {
            update: {
              type: 'object',
              properties: {
                aId: { 
                  type: 'number',
                  description: 'Accessory ID'
                },
                sId: { 
                  type: 'number',
                  description: 'Service ID'
                },
                cId: { 
                  type: 'number',
                  description: 'Characteristic ID'
                },
                control: {
                  type: 'object',
                  properties: {
                    value: { $ref: '#/definitions/ControlValue' }
                  },
                  required: ['value'],
                  additionalProperties: false
                }
              },
              required: ['aId', 'sId', 'cId', 'control'],
              additionalProperties: false
            }
          },
          required: ['update'],
          additionalProperties: false
        }
      },
      required: ['characteristic'],
      additionalProperties: false
    },
    result: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean' },
        code: { type: 'number' },
        message: { type: 'string' }
      }
    },
    examples: [
      {
        description: 'Turn on a switch (boolean value)',
        request: {
          params: {
            characteristic: {
              update: {
                aId: 258,
                sId: 13,
                cId: 15,
                control: {
                  value: { boolValue: true }
                }
              }
            }
          }
        }
      },
      {
        description: 'Set security system mode (integer value)',
        request: {
          params: {
            characteristic: {
              update: {
                aId: 2,
                sId: 13,
                cId: 16,
                control: {
                  value: { intValue: 1 }
                }
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = accessoryMethods;