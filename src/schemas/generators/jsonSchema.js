/**
 * JSON Schema generator for SprutHub API
 */

/**
 * Generate a pure JSON Schema document from the SprutHub schema
 * @param {object} sprutSchema - The complete SprutHub schema
 * @returns {object} JSON Schema document
 */
function generateJsonSchema(sprutSchema) {
  const jsonSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: sprutSchema.title,
    description: sprutSchema.description,
    version: sprutSchema.version,
    
    definitions: sprutSchema.definitions,
    
    properties: {
      // JSON-RPC request structure
      request: {
        type: 'object',
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          method: { 
            type: 'string',
            enum: Object.keys(sprutSchema.methods)
          },
          params: {
            type: 'object',
            description: 'Method parameters (varies by method)'
          },
          id: { 
            type: ['number', 'string'],
            description: 'Request ID'
          }
        },
        required: ['jsonrpc', 'method', 'params', 'id'],
        additionalProperties: false
      },
      
      // JSON-RPC response structure
      response: {
        oneOf: [
          {
            type: 'object',
            properties: {
              jsonrpc: { type: 'string', const: '2.0' },
              result: { type: 'object' },
              id: { type: ['number', 'string'] }
            },
            required: ['jsonrpc', 'result', 'id'],
            additionalProperties: false
          },
          {
            type: 'object',
            properties: {
              jsonrpc: { type: 'string', const: '2.0' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'number' },
                  message: { type: 'string' },
                  data: {}
                },
                required: ['code', 'message'],
                additionalProperties: false
              },
              id: { type: ['number', 'string'] }
            },
            required: ['jsonrpc', 'error', 'id'],
            additionalProperties: false
          }
        ]
      }
    }
  };

  return jsonSchema;
}

/**
 * Generate JSON Schema for a specific method
 * @param {string} methodName - Method name
 * @param {object} methodSchema - Method schema from SprutHub
 * @returns {object} JSON Schema for the specific method
 */
function generateMethodJsonSchema(methodName, methodSchema) {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: `${methodName} Method Schema`,
    description: methodSchema.description,
    type: 'object',
    
    definitions: {
      request: {
        type: 'object',
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          method: { type: 'string', const: methodName },
          params: methodSchema.params,
          id: { type: ['number', 'string'] }
        },
        required: ['jsonrpc', 'method', 'params', 'id'],
        additionalProperties: false
      },
      
      response: {
        type: 'object',
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          result: methodSchema.result,
          id: { type: ['number', 'string'] }
        },
        required: ['jsonrpc', 'result', 'id'],
        additionalProperties: false
      }
    },
    
    examples: methodSchema.examples || []
  };
}

module.exports = {
  generateJsonSchema,
  generateMethodJsonSchema
};