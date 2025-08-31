const Sprut = require('./core/client');
const Queue = require('./queue');
const Schema = require('./schemas');
const { generateJsonSchema, generateMethodJsonSchema } = require('./schemas/generators/jsonSchema');
const { generateOpenApiSchema } = require('./schemas/generators/openapi');
const { generateTypeScriptDefinitions } = require('./schemas/generators/typescript');

module.exports = {
  Sprut,
  Queue,
  Schema,
  generators: {
    generateJsonSchema,
    generateMethodJsonSchema,
    generateOpenApiSchema,
    generateTypeScriptDefinitions
  }
};