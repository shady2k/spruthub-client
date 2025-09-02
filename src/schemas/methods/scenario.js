/**
 * Scenario-related JSON-RPC method schemas
 */

const scenarioMethods = {
  'scenario.list': {
    description: 'List all scenarios',
    category: 'scenario',
    method: 'scenario.list',
    rest: { method: 'GET', path: '/scenarios' },
    params: {
      type: 'object',
      properties: {
        scenario: {
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
      required: ['scenario'],
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
            scenarios: {
              type: 'array',
              items: { $ref: '#/definitions/Scenario' }
            }
          }
        }
      }
    },
    examples: [
      {
        description: 'List all scenarios',
        request: {
          params: {
            scenario: {
              list: {}
            }
          }
        }
      }
    ]
  },

  'scenario.get': {
    description: 'Get a specific scenario by index',
    category: 'scenario',
    method: 'scenario.get',
    rest: { method: 'GET', path: '/scenarios/:index' },
    params: {
      type: 'object',
      properties: {
        scenario: {
          type: 'object',
          properties: {
            get: {
              type: 'object',
              properties: {
                index: { 
                  type: 'string',
                  description: 'Scenario index/ID (string format)'
                },
                expand: { 
                  type: 'string',
                  description: 'Properties to expand (e.g., "data")',
                  default: 'data'
                }
              },
              required: ['index'],
              additionalProperties: false
            }
          },
          required: ['get'],
          additionalProperties: false
        }
      },
      required: ['scenario'],
      additionalProperties: false
    },
    result: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean' },
        code: { type: 'number' },
        message: { type: 'string' },
        data: { $ref: '#/definitions/Scenario' }
      }
    },
    examples: [
      {
        description: 'Get scenario with string index',
        request: {
          params: {
            scenario: {
              get: {
                index: '1',
                expand: 'data'
              }
            }
          }
        }
      },
      {
        description: 'Get scenario with string index',
        request: {
          params: {
            scenario: {
              get: {
                index: '1',
                expand: 'data'
              }
            }
          }
        }
      }
    ]
  },

  'scenario.create': {
    description: 'Create a new scenario',
    category: 'scenario',
    method: 'scenario.create',
    rest: { method: 'POST', path: '/scenarios' },
    params: {
      type: 'object',
      properties: {
        scenario: {
          type: 'object',
          properties: {
            create: {
              type: 'object',
              properties: {
                name: { 
                  type: 'string',
                  maxLength: 255,
                  description: 'Scenario name',
                  default: ''
                },
                desc: { 
                  type: 'string',
                  description: 'Scenario description',
                  default: ''
                },
                type: { 
                  type: 'string',
                  enum: ['BLOCK', 'LOGIC', 'GLOBAL'],
                  description: 'Scenario type',
                  default: 'BLOCK'
                },
                active: { 
                  type: 'boolean',
                  description: 'Whether scenario is active',
                  default: true
                },
                onStart: { 
                  type: 'boolean',
                  description: 'Run on system start',
                  default: true
                },
                sync: { 
                  type: 'boolean',
                  description: 'Synchronous execution',
                  default: false
                },
                data: { 
                  type: 'string',
                  description: 'Scenario data (JSON string)'
                }
              },
              required: [],
              additionalProperties: false
            }
          },
          required: ['create'],
          additionalProperties: false
        }
      },
      required: ['scenario'],
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
            index: { type: 'string' }
          }
        }
      }
    },
    examples: [
      {
        description: 'Create a block scenario with logging',
        request: {
          params: {
            scenario: {
              create: {
                name: "Test Scenario",
                desc: "A test scenario for demonstration",
                type: "BLOCK",
                active: true,
                onStart: true,
                sync: false,
                data: ""
              }
            }
          }
        }
      }
    ]
  },

  'scenario.update': {
    description: 'Update an existing scenario',
    category: 'scenario',
    method: 'scenario.update',
    rest: { method: 'PUT', path: '/scenarios' },
    params: {
      type: 'object',
      properties: {
        scenario: {
          type: 'object',
          properties: {
            update: {
              type: 'object',
              properties: {
                index: { 
                  type: 'string',
                  description: 'Scenario index/ID (string format, e.g., "95")'
                },
                name: { 
                  type: 'string',
                  maxLength: 255,
                  description: 'Scenario name',
                  default: ''
                },
                desc: { 
                  type: 'string',
                  description: 'Scenario description',
                  default: ''
                },
                type: { 
                  type: 'string',
                  enum: ['BLOCK', 'LOGIC', 'GLOBAL'],
                  description: 'Scenario type',
                  default: 'BLOCK'
                },
                active: { 
                  type: 'boolean',
                  description: 'Whether scenario is active',
                  default: true
                },
                onStart: { 
                  type: 'boolean',
                  description: 'Run on system start',
                  default: true
                },
                sync: { 
                  type: 'boolean',
                  description: 'Synchronous execution',
                  default: false
                },
                data: { 
                  type: 'string',
                  description: 'Updated scenario data as JSON string (e.g., "{\\"blockId\\":0,\\"targets\\":[]}")',
                  minLength: 0
                }
              },
              required: ['index'],
              additionalProperties: false
            }
          },
          required: ['update'],
          additionalProperties: false
        }
      },
      required: ['scenario'],
      additionalProperties: false
    },
    result: {
      type: 'object',
      properties: {
        scenario: {
          type: 'object',
          properties: {
            update: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          },
          required: ['update'],
          additionalProperties: false
        }
      },
      required: ['scenario'],
      additionalProperties: false
    },
    examples: [
      {
        description: 'Update scenario data with code block',
        request: {
          params: {
            scenario: {
              update: {
                index: "95",
                data: '{"blockId":0,"targets":[{"type":"code","code":"log.info(\\"Hello World\\")\\n"}]}'
              }
            }
          }
        }
      }
    ]
  },

  'scenario.delete': {
    description: 'Delete a scenario',
    category: 'scenario',
    method: 'scenario.delete',
    rest: { method: 'DELETE', path: '/scenarios/:index' },
    params: {
      type: 'object',
      properties: {
        scenario: {
          type: 'object',
          properties: {
            delete: {
              type: 'object',
              properties: {
                index: { 
                  anyOf: [
                    { type: 'number' },
                    { type: 'string' }
                  ],
                  description: 'Scenario index/ID to delete (can be numeric or string)'
                }
              },
              required: ['index'],
              additionalProperties: false
            }
          },
          required: ['delete'],
          additionalProperties: false
        }
      },
      required: ['scenario'],
      additionalProperties: false
    },
    result: {
      type: 'object',
      properties: {
        scenario: {
          type: 'object',
          properties: {
            delete: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          },
          required: ['delete'],
          additionalProperties: false
        }
      },
      required: ['scenario'],
      additionalProperties: false
    },
    examples: [
      {
        description: 'Delete scenario by numeric index',
        request: {
          params: {
            scenario: {
              delete: {
                index: 95
              }
            }
          }
        }
      },
      {
        description: 'Delete scenario by string index',
        request: {
          params: {
            scenario: {
              delete: {
                index: "95"
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = scenarioMethods;
