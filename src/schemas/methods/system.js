/**
 * System-related method schemas (high-level aggregations)
 */

const systemMethods = {
  

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