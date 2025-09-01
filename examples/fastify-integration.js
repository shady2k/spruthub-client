/**
 * Example showing how to integrate SprutHub schema system with Fastify
 * to automatically discover methods and generate route configurations
 */

const { Schema } = require('../src');

function generateFastifyIntegration() {
  console.log('=== SprutHub Fastify Integration Example ===\n');

  // Show available methods for Fastify integration
  console.log('1. Available Methods for Fastify:');
  console.log(`   Total Methods: ${Schema.getAvailableMethods().length}`);
  console.log('   Categories:');
  Schema.getCategories().forEach(category => {
    const methods = Schema.getMethodsByCategory(category);
    console.log(`     ${category}: ${Object.keys(methods).length} methods`);
  });
  console.log();

  // Generate schema files for Fastify routes
  console.log('2. Fastify Route Schemas:');
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
  console.log('   Using getRestMethods() to dynamically generate routes:');
  console.log();

  const restMethods = Schema.getRestMethods();

  restMethods.forEach(restMethod => {
    const { httpMethod, path, schema } = restMethod;
    console.log(`   app.${httpMethod.toLowerCase()}('${path}', schema, handler);`);
    console.log(`     // ${schema.description}`);
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

  console.log('6. Benefits for Fastify Integration:');
  console.log('   ✓ Schema-driven API discovery');
  console.log('   ✓ Consistent request/response validation'); 
  console.log('   ✓ Framework-agnostic integration');
  console.log('   ✓ Type-safe development');
  console.log('   ✓ API change detection');
  console.log('   ✓ Reduced manual schema maintenance');
  console.log();

  console.log('7. Integration Possibilities:');
  console.log('   - Build custom schema generators in consuming apps');
  console.log('   - Create framework-specific adapters');
  console.log('   - Generate documentation from schema data');
  console.log('   - Build validation middleware using raw schemas');
  console.log();

  console.log('=== Integration Example Complete ===');
}

if (require.main === module) {
  generateFastifyIntegration();
}

module.exports = { generateFastifyIntegration };
