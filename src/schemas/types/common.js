/**
 * Common type definitions for SprutHub JSON-RPC API
 */

const commonTypes = {
  // Standard JSON-RPC response wrapper
  JsonRpcResponse: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      jsonrpc: { type: 'string', const: '2.0' },
      result: { type: 'object' },
      error: {
        type: 'object',
        properties: {
          code: { type: 'number' },
          message: { type: 'string' },
          data: {}
        }
      }
    },
    required: ['id', 'jsonrpc']
  },

  // Standard API response structure
  ApiResponse: {
    type: 'object',
    properties: {
      isSuccess: { type: 'boolean' },
      code: { type: 'number' },
      message: { type: 'string' },
      data: {}
    },
    required: ['isSuccess', 'code', 'message']
  },

  // Common error codes mapping
  ErrorCodes: {
    '-666003': 'Invalid or expired token',
    '-1': 'General error',
    '0': 'Success'
  },

  // Value types for characteristics
  ValueTypes: {
    boolValue: { type: 'boolean' },
    intValue: { type: 'integer' },
    stringValue: { type: 'string' },
    floatValue: { type: 'number' }
  },

  // Control value structure
  ControlValue: {
    oneOf: [
      { type: 'object', properties: { boolValue: { type: 'boolean' } } },
      { type: 'object', properties: { intValue: { type: 'integer' } } },
      { type: 'object', properties: { stringValue: { type: 'string' } } },
      { type: 'object', properties: { floatValue: { type: 'number' } } }
    ]
  }
};

module.exports = commonTypes;