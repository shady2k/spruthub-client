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
  },

  'log.subscribe': {
    description: 'Subscribe to real-time log streaming via WebSocket events',
    category: 'logs',
    method: 'log.subscribe',
    websocketOnly: true,
    params: {
      type: 'object',
      properties: {
        log: {
          type: 'object',
          properties: {
            subscribe: {
              type: 'object',
              additionalProperties: false
            }
          },
          required: ['subscribe'],
          additionalProperties: false
        }
      },
      required: ['log'],
      additionalProperties: false
    },
    result: {
      type: 'object',
      properties: {
        log: {
          type: 'object',
          properties: {
            subscribe: {
              type: 'object',
              properties: {
                uuid: {
                  type: 'string',
                  description: 'Unique identifier for this log subscription'
                }
              },
              required: ['uuid'],
              additionalProperties: false
            }
          },
          required: ['subscribe'],
          additionalProperties: false
        }
      },
      required: ['log'],
      additionalProperties: false
    },
    events: {
      'log.log': {
        description: 'Real-time log entry event',
        type: 'object',
        properties: {
          event: {
            type: 'object',
            properties: {
              log: {
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
            },
            required: ['log'],
            additionalProperties: false
          }
        },
        required: ['event'],
        additionalProperties: false
      }
    },
    examples: [
      {
        description: 'Subscribe to real-time log streaming',
        request: {
          params: {
            log: {
              subscribe: {}
            }
          }
        },
        response: {
          log: {
            subscribe: {
              uuid: "9b500960-0f6a-4484-a3a3-d802806fa89b"
            }
          }
        },
        event: {
          event: {
            log: {
              log: [
                {
                  time: 1757060365891,
                  level: "LOG_LEVEL_INFO",
                  path: "Notifiers.Notifier",
                  message: "273 Virtual: Текущий режим замка: Не закрыт - Замок «Коридор»"
                }
              ]
            }
          }
        }
      }
    ]
  },

  'log.unsubscribe': {
    description: 'Unsubscribe from real-time log streaming',
    category: 'logs',
    method: 'log.unsubscribe',
    websocketOnly: true,
    params: {
      type: 'object',
      properties: {
        log: {
          type: 'object',
          properties: {
            unsubscribe: {
              type: 'object',
              properties: {
                uuid: {
                  type: 'string',
                  description: 'Subscription UUID to unsubscribe from'
                }
              },
              required: ['uuid'],
              additionalProperties: false
            }
          },
          required: ['unsubscribe'],
          additionalProperties: false
        }
      },
      required: ['log'],
      additionalProperties: false
    },
    result: {
      type: 'object',
      properties: {
        log: {
          type: 'object',
          properties: {
            unsubscribe: {
              type: 'object',
              additionalProperties: false
            }
          },
          required: ['unsubscribe'],
          additionalProperties: false
        }
      },
      required: ['log'],
      additionalProperties: false
    },
    examples: [
      {
        description: 'Unsubscribe from log streaming',
        request: {
          params: {
            log: {
              unsubscribe: {
                uuid: "9b500960-0f6a-4484-a3a3-d802806fa89b"
              }
            }
          }
        },
        response: {
          log: {
            unsubscribe: {}
          }
        }
      }
    ]
  }
};

module.exports = logMethods;