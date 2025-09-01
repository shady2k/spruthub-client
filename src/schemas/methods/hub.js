/**
 * Hub-related JSON-RPC method schemas
 */

const hubMethods = {
  'hub.list': {
    description: 'List all SprutHub devices/hubs in the system',
    category: 'hub',
    method: 'hub.list',
    params: {
      type: 'object',
      properties: {
        hub: {
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
      required: ['hub'],
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
              items: {
                type: 'object',
                properties: {
                  serial: { type: 'string' },
                  name: { type: 'string' },
                  manufacturer: { type: 'string' },
                  model: { type: 'string' },
                  owner: { type: 'string' },
                  lang: { type: 'string' },
                  lastSeen: { type: 'number' },
                  online: { type: 'boolean' },
                  discovery: { type: 'boolean' },
                  version: {
                    type: 'object',
                    properties: {
                      current: {
                        type: 'object',
                        properties: {
                          revision: { type: 'number' },
                          template: { type: 'number' },
                          version: { type: 'string' },
                          hardware: { type: 'string' }
                        }
                      },
                      upgrade: {
                        type: 'object',
                        properties: {
                          revision: { type: 'number' },
                          template: { type: 'number' },
                          version: { type: 'string' }
                        }
                      },
                      branch: { type: 'string' }
                    }
                  },
                  platform: {
                    type: 'object',
                    properties: {
                      manufacturer: { type: 'string' },
                      model: { type: 'string' },
                      serial: { type: 'string' },
                      mac: { type: 'string' },
                      jdk: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    examples: [
      {
        description: 'List all hubs',
        request: {
          params: {
            hub: {
              list: {}
            }
          }
        }
      }
    ]
  },

  'server.clientInfo': {
    description: 'Set client information for the current connection',
    category: 'hub',
    method: 'server.clientInfo',
    params: {
      type: 'object',
      properties: {
        server: {
          type: 'object',
          properties: {
            clientInfo: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                type: { 
                  type: 'string',
                  enum: ['CLIENT_DESKTOP', 'CLIENT_MOBILE', 'CLIENT_WEB', 'CLIENT_API']
                },
                auth: { type: 'string' }
              },
              required: ['id', 'name', 'type', 'auth'],
              additionalProperties: false
            }
          },
          required: ['clientInfo'],
          additionalProperties: false
        }
      },
      required: ['server'],
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
          properties: {}
        }
      }
    },
    examples: [
      {
        description: 'Set client information',
        request: {
          params: {
            server: {
              clientInfo: {
                id: "client-uuid",
                name: "My Application",
                type: "CLIENT_API",
                auth: "auth-token-here"
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = hubMethods;