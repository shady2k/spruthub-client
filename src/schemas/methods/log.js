/**
 * Log-related JSON-RPC method schemas
 */

const logMethods = {
  'log.list': {
    description: 'Get system logs with optional count limit',
    category: 'logs',
    method: 'log.list', 
    rest: { method: 'GET', path: '/logs' },
    params: {
      type: 'object',
      properties: {
        log: {
          type: 'object',
          properties: {
            list: {
              type: 'object',
              properties: {
                count: { 
                  type: 'number',
                  minimum: 1,
                  maximum: 1000,
                  description: 'Number of log entries to retrieve',
                  default: 100
                }
              },
              additionalProperties: false
            }
          },
          required: ['list'],
          additionalProperties: false
        }
      },
      required: ['log'],
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
            log: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  time: { 
                    type: 'number',
                    description: 'Unix timestamp in milliseconds'
                  },
                  level: { 
                    type: 'string',
                    enum: ['LOG_LEVEL_DEBUG', 'LOG_LEVEL_INFO', 'LOG_LEVEL_WARN', 'LOG_LEVEL_ERROR', 'LOG_LEVEL_FATAL'],
                    description: 'Log severity level'
                  },
                  path: { 
                    type: 'string',
                    description: 'Component or module that generated the log'
                  },
                  message: { 
                    type: 'string',
                    description: 'Log message content'
                  }
                },
                required: ['time', 'level', 'path', 'message'],
                additionalProperties: false
              }
            }
          },
          required: ['log'],
          additionalProperties: false
        }
      }
    },
    examples: [
      {
        description: 'Get logs with default count (100)',
        request: {
          params: {
            log: {
              list: {}
            }
          }
        }
      },
      {
        description: 'Get last 200 log entries',
        request: {
          params: {
            log: {
              list: {
                count: 200
              }
            }
          }
        }
      },
      {
        description: 'Get last 50 log entries',
        request: {
          params: {
            log: {
              list: {
                count: 50
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = logMethods;