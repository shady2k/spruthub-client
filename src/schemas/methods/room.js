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
  }
};

module.exports = roomMethods;