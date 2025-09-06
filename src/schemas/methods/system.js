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
            version: { type: 'string' },
            revision: { type: 'number' },
            template: { type: 'number' },
            hardware: { type: 'string' },
            branch: { type: 'string' },
            platform: {
              type: 'object',
              properties: {
                manufacturer: { type: 'string' },
                model: { type: 'string' },
                serial: { type: 'string' },
                mac: { type: 'string' },
                jdk: { type: 'string' }
              }
            },
            name: { type: 'string' },
            manufacturer: { type: 'string' },
            model: { type: 'string' },
            serial: { type: 'string' },
            owner: { type: 'string' },
            lang: { type: 'string' },
            online: { type: 'boolean' },
            lastSeen: { type: 'number' },
            discovery: { type: 'boolean' }
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