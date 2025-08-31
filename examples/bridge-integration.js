/**
 * Example showing how sprut-http-bridge could use the schema system
 * to automatically generate routes and API documentation
 */

const { Schema, generators } = require('../src');

function generateBridgeConfig() {
  console.log('=== SprutHub Bridge Integration Example ===\n');

  // Generate OpenAPI specification for the bridge
  const openApiSpec = generators.generateOpenApiSchema(Schema.schema, {
    title: 'SprutHub HTTP Bridge API',
    version: '1.0.0',
    description: 'RESTful HTTP bridge for SprutHub smart home system',
    baseUrl: 'http://localhost:3000'
  });

  console.log('1. Generated OpenAPI Specification:');
  console.log(`   Title: ${openApiSpec.info.title}`);
  console.log(`   Version: ${openApiSpec.info.version}`);
  console.log(`   Available Endpoints: ${Object.keys(openApiSpec.paths).length}`);
  console.log('   Endpoints:');
  Object.keys(openApiSpec.paths).forEach(path => {
    const methods = Object.keys(openApiSpec.paths[path]);
    console.log(`     ${methods[0].toUpperCase()} ${path}`);
  });
  console.log();

  // Generate schema files for use in sprut-http-bridge/schemas/
  console.log('2. Schema Files for Bridge:');
  console.log('   These could be generated automatically:');
  console.log();

  // Generate individual schema files like sprut-http-bridge uses
  const methodSchemas = {
    'accessories': Schema.getMethodSchema('accessory.list'),
    'update': Schema.getMethodSchema('characteristic.update'), 
    'hubs': Schema.getMethodSchema('hub.list'),
    'rooms': Schema.getMethodSchema('room.list'),
    'version': Schema.getMethodSchema('system.version'),
    'systemInfo': Schema.getMethodSchema('system.getFullInfo'),
    'scenarios/get': Schema.getMethodSchema('scenario.get')
  };

  Object.entries(methodSchemas).forEach(([filename, schema]) => {
    if (schema) {
      console.log(`   schemas/${filename}.js:`);
      console.log(`     Description: ${schema.description}`);
      console.log(`     Method: ${schema.method}`);
      console.log(`     Category: ${schema.category}`);
      console.log(`     Has Examples: ${schema.examples?.length > 0 ? 'Yes' : 'No'}`);
      console.log();
    }
  });

  // Show how to generate Fastify schema format
  console.log('3. Fastify Schema Format Example:');
  const accessoryListSchema = Schema.getMethodSchema('accessory.list');
  
  const fastifySchema = {
    schema: {
      description: accessoryListSchema.description,
      tags: [accessoryListSchema.category],
      summary: accessoryListSchema.description,
      querystring: {
        type: 'object',
        properties: {
          expand: {
            type: 'string',
            description: 'Comma-separated list of properties to expand',
            default: 'services,characteristics'
          }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            result: accessoryListSchema.result
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  };

  console.log('   Generated Fastify schema structure:');
  console.log(`   Description: ${fastifySchema.schema.description}`);
  console.log(`   Tags: [${fastifySchema.schema.tags.join(', ')}]`);
  console.log(`   Has Query Parameters: ${!!fastifySchema.schema.querystring}`);
  console.log(`   Response Codes: ${Object.keys(fastifySchema.schema.response).join(', ')}`);
  console.log();

  // Show route generation pattern
  console.log('4. Automatic Route Generation Pattern:');
  console.log('   This could replace manual route definitions:');
  console.log();

  const routeMappings = {
    'hub.list': { path: '/hubs', method: 'GET' },
    'accessory.list': { path: '/accessories', method: 'GET' },
    'characteristic.update': { path: '/update', method: 'POST' },
    'room.list': { path: '/rooms', method: 'GET' },
    'system.version': { path: '/version', method: 'GET' },
    'system.getFullInfo': { path: '/system-info', method: 'GET' },
    'scenario.list': { path: '/scenarios', method: 'GET' },
    'scenario.get': { path: '/scenarios/:id', method: 'GET' },
    'scenario.create': { path: '/scenarios', method: 'POST' },
    'scenario.update': { path: '/scenarios/:id', method: 'PUT' },
    'scenario.delete': { path: '/scenarios/:id', method: 'DELETE' }
  };

  Object.entries(routeMappings).forEach(([methodName, route]) => {
    const schema = Schema.getMethodSchema(methodName);
    if (schema) {
      console.log(`   app.${route.method.toLowerCase()}('${route.path}', schema, handler);`);
      console.log(`     // ${schema.description}`);
    }
  });
  console.log();

  // Show validation usage
  console.log('5. Request Validation Example:');
  console.log('   Using schemas for validation:');
  console.log();

  console.log('   function validateRequest(methodName, requestData) {');
  console.log('     const schema = Schema.getMethodSchema(methodName);');
  console.log('     // Use schema.params to validate requestData');
  console.log('     // Return validation result');
  console.log('   }');
  console.log();

  console.log('   Example validation:');
  const updateSchema = Schema.getMethodSchema('characteristic.update');
  const exampleValidation = updateSchema.examples[0];
  console.log('   Valid request structure:');
  console.log('   ', JSON.stringify(exampleValidation.request.params, null, 2));
  console.log();

  console.log('6. Benefits for Bridge Development:');
  console.log('   ✓ Automatic schema generation');
  console.log('   ✓ Consistent API documentation'); 
  console.log('   ✓ Request validation');
  console.log('   ✓ Type safety');
  console.log('   ✓ API change detection');
  console.log('   ✓ Reduced manual maintenance');
  console.log();

  console.log('7. Future Enhancements:');
  console.log('   - Schema versioning and compatibility checking');
  console.log('   - Automatic test generation from examples');
  console.log('   - Live API documentation updates');
  console.log('   - Client SDK generation');
  console.log();

  console.log('=== Integration Example Complete ===');
}

if (require.main === module) {
  generateBridgeConfig();
}

module.exports = { generateBridgeConfig };