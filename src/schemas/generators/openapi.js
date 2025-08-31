/**
 * OpenAPI/Swagger schema generator for SprutHub API
 * Useful for generating REST API bridges like sprut-http-bridge
 */

/**
 * Generate OpenAPI 3.0 specification from SprutHub schema
 * @param {object} sprutSchema - The complete SprutHub schema
 * @param {object} options - Generation options
 * @returns {object} OpenAPI 3.0 specification
 */
function generateOpenApiSchema(sprutSchema, options = {}) {
  const {
    title = 'SprutHub API',
    version = '1.0.0',
    description = 'RESTful API for SprutHub smart home system',
    baseUrl = 'http://localhost:3000'
  } = options;

  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title,
      version,
      description,
      contact: {
        name: 'SprutHub API Support'
      }
    },
    servers: [
      {
        url: baseUrl,
        description: 'SprutHub API Server'
      }
    ],
    paths: {},
    components: {
      schemas: convertTypesToOpenApiSchemas(sprutSchema.definitions),
      responses: {
        Error: {
          description: 'Error response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    tags: Object.keys(sprutSchema.categories).map(category => ({
      name: category,
      description: sprutSchema.categories[category].description
    }))
  };

  // Convert JSON-RPC methods to REST endpoints
  Object.entries(sprutSchema.methods).forEach(([methodName, methodSchema]) => {
    const restEndpoint = convertMethodToRestEndpoint(methodName, methodSchema);
    if (restEndpoint) {
      openApiSpec.paths[restEndpoint.path] = restEndpoint.spec;
    }
  });

  return openApiSpec;
}

/**
 * Convert SprutHub method to REST endpoint
 * @param {string} methodName - JSON-RPC method name
 * @param {object} methodSchema - Method schema
 * @returns {object|null} REST endpoint specification
 */
function convertMethodToRestEndpoint(methodName, methodSchema) {
  const mapping = {
    // Hub methods
    'hub.list': { path: '/hubs', method: 'get' },
    'server.clientInfo': { path: '/client-info', method: 'post' },
    
    // Accessory methods
    'accessory.list': { path: '/accessories', method: 'get' },
    'characteristic.update': { path: '/accessories/update', method: 'post' },
    
    // Scenario methods
    'scenario.list': { path: '/scenarios', method: 'get' },
    'scenario.get': { path: '/scenarios/{id}', method: 'get' },
    'scenario.create': { path: '/scenarios', method: 'post' },
    'scenario.update': { path: '/scenarios/{id}', method: 'put' },
    'scenario.delete': { path: '/scenarios/{id}', method: 'delete' },
    
    // Room methods
    'room.list': { path: '/rooms', method: 'get' },
    
    // System methods
    'system.getFullInfo': { path: '/system-info', method: 'get' },
    'system.version': { path: '/version', method: 'get' }
  };

  const endpoint = mapping[methodName];
  if (!endpoint) return null;

  const spec = {
    [endpoint.method]: {
      summary: methodSchema.description,
      description: methodSchema.description,
      tags: [methodSchema.category],
      operationId: methodName.replace('.', '_'),
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: methodSchema.result
            }
          }
        },
        '500': {
          '$ref': '#/components/responses/Error'
        }
      }
    }
  };

  // Add parameters for GET methods with query strings
  if (endpoint.method === 'get' && methodSchema.params) {
    spec[endpoint.method].parameters = convertParamsToQueryParameters(methodSchema.params);
  }

  // Add request body for POST/PUT methods
  if (['post', 'put'].includes(endpoint.method) && methodSchema.params) {
    spec[endpoint.method].requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: convertParamsToRequestBody(methodSchema.params)
        }
      }
    };
  }

  // Add path parameters
  if (endpoint.path.includes('{')) {
    const pathParams = extractPathParameters(endpoint.path);
    if (!spec[endpoint.method].parameters) {
      spec[endpoint.method].parameters = [];
    }
    pathParams.forEach(param => {
      spec[endpoint.method].parameters.push({
        name: param,
        in: 'path',
        required: true,
        schema: { type: 'string' }
      });
    });
  }

  return {
    path: endpoint.path,
    spec
  };
}

/**
 * Convert SprutHub types to OpenAPI schemas
 * @param {object} definitions - SprutHub type definitions
 * @returns {object} OpenAPI schemas
 */
function convertTypesToOpenApiSchemas(definitions) {
  const schemas = {};
  
  Object.entries(definitions).forEach(([name, definition]) => {
    schemas[name] = convertTypeToOpenApiSchema(definition);
  });

  return schemas;
}

/**
 * Convert single type to OpenAPI schema
 * @param {object} definition - Type definition
 * @returns {object} OpenAPI schema
 */
function convertTypeToOpenApiSchema(definition) {
  if (definition.oneOf) {
    return {
      oneOf: definition.oneOf.map(convertTypeToOpenApiSchema)
    };
  }
  
  if (definition.type === 'object' && definition.properties) {
    const schema = {
      type: 'object',
      properties: {}
    };
    
    Object.entries(definition.properties).forEach(([propName, propDef]) => {
      schema.properties[propName] = convertTypeToOpenApiSchema(propDef);
    });
    
    if (definition.required) {
      schema.required = definition.required;
    }
    
    return schema;
  }
  
  if (definition.type === 'array' && definition.items) {
    return {
      type: 'array',
      items: convertTypeToOpenApiSchema(definition.items)
    };
  }
  
  return definition;
}

/**
 * Convert JSON-RPC params to query parameters
 * @param {object} params - Method parameters
 * @returns {Array} Query parameters
 */
function convertParamsToQueryParameters(params) {
  // For simple cases, extract query parameters from nested structure
  const parameters = [];
  
  // This is a simplified conversion - would need more logic for complex cases
  if (params.properties) {
    Object.entries(params.properties).forEach(([_name, prop]) => {
      if (prop.properties) {
        Object.entries(prop.properties).forEach(([_subName, subProp]) => {
          if (subProp.properties) {
            Object.entries(subProp.properties).forEach(([paramName, paramDef]) => {
              parameters.push({
                name: paramName,
                in: 'query',
                required: false,
                schema: paramDef,
                description: paramDef.description
              });
            });
          }
        });
      }
    });
  }
  
  return parameters;
}

/**
 * Convert JSON-RPC params to request body schema
 * @param {object} params - Method parameters
 * @returns {object} Request body schema
 */
function convertParamsToRequestBody(params) {
  // Extract the actual payload from nested JSON-RPC structure
  // This is simplified - would need more logic for different patterns
  return params;
}

/**
 * Extract path parameters from OpenAPI path
 * @param {string} path - OpenAPI path with {param} syntax
 * @returns {Array} Parameter names
 */
function extractPathParameters(path) {
  const matches = path.match(/{([^}]+)}/g);
  return matches ? matches.map(match => match.slice(1, -1)) : [];
}

module.exports = {
  generateOpenApiSchema,
  convertMethodToRestEndpoint
};