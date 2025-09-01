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
                  type: ['number', 'string'],
                  description: 'Scenario index/ID (can be numeric or string)'
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
        description: 'Get scenario with numeric index',
        request: {
          params: {
            scenario: {
              get: {
                index: 1,
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
                index: 'scenario-id',
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
                  minLength: 1,
                  maxLength: 255,
                  description: 'Scenario name'
                },
                desc: { 
                  type: 'string',
                  description: 'Scenario description',
                  default: ''
                },
                type: { 
                  type: 'string',
                  enum: ['BLOCK', 'CLASSIC'],
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
              required: ['name'],
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
            index: { type: 'number' }
          }
        }
      }
    },
    examples: [
      {
        description: 'Create a simple block scenario',
        request: {
          params: {
            scenario: {
              create: {
                name: 'Evening Lights',
                desc: 'Turn on evening lighting',
                type: 'BLOCK',
                data: '{"blocks": []}'
              }
            }
          }
        }
      },
      {
        description: 'Create minimal block scenario',
        request: {
          params: {
            scenario: {
              create: {
                type: 'BLOCK',
                name: 'My Scenario',
                desc: 'Scenario description',
                onStart: true,
                active: true,
                sync: false,
                data: '{"blockId":0,"targets":[]}'
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
    rest: { method: 'PUT', path: '/scenarios/:index' },
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
                  type: ['number', 'string'],
                  description: 'Scenario index/ID (can be numeric or string)'
                },
                data: { 
                  type: 'string',
                  description: 'Updated scenario data (JSON string)'
                }
              },
              required: ['index', 'data'],
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
        isSuccess: { type: 'boolean' },
        code: { type: 'number' },
        message: { type: 'string' }
      }
    },
    examples: [
      {
        description: 'Update scenario with numeric index',
        request: {
          params: {
            scenario: {
              update: {
                index: 1,
                data: '{"blocks": [{"type": "action"}]}'
              }
            }
          }
        }
      },
      {
        description: 'Update scenario with string index',
        request: {
          params: {
            scenario: {
              update: {
                index: 'scenario-id',
                data: '{"blockId":0,"targets":[{"type":"code","code":"log.info(\"example\")"}]}'
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
                  type: 'number',
                  description: 'Scenario index/ID to delete'
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
        isSuccess: { type: 'boolean' },
        code: { type: 'number' },
        message: { type: 'string' }
      }
    },
    examples: [
      {
        description: 'Delete scenario by numeric index',
        request: {
          params: {
            scenario: {
              delete: {
                index: 1
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
                index: 'scenario-id'
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = scenarioMethods;
