/**
 * Room-related JSON-RPC method schemas
 */

const roomMethods = {
  'room.list': {
    description: 'List all rooms',
    category: 'room',
    method: 'room.list',
    params: {
      type: 'object',
      properties: {
        room: {
          type: 'object',
          properties: {
            list: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          },
          required: ['list'],
          additionalProperties: false
        }
      },
      required: ['room'],
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
            rooms: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  order: { type: 'number' },
                  type: { type: 'string' },
                  visible: { type: 'boolean' }
                },
                required: ['id', 'name']
              }
            }
          }
        }
      }
    },
    examples: [
      {
        description: 'List all rooms',
        request: {
          params: {
            room: {
              list: {}
            }
          }
        }
      }
    ]
  },

  'room.get': {
    description: 'Get a specific room by ID',
    category: 'room',
    method: 'room.get',
    params: {
      type: 'object',
      properties: {
        room: {
          type: 'object',
          properties: {
            get: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Room ID to retrieve'
                }
              },
              required: ['id'],
              additionalProperties: false
            }
          },
          required: ['get'],
          additionalProperties: false
        }
      },
      required: ['room'],
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
            room: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                order: { type: 'number' },
                visible: { type: 'boolean' }
              },
              required: ['id', 'name']
            }
          }
        }
      }
    },
    examples: [
      {
        description: 'Get room with ID 13',
        request: {
          params: {
            room: {
              get: {
                id: 13
              }
            }
          }
        },
        response: {
          result: {
            room: {
              get: {
                id: 13,
                order: 0,
                visible: true,
                name: "Мой дом"
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = roomMethods;