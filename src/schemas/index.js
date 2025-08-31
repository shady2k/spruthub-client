/**
 * Main schema export for SprutHub JSON-RPC API
 */

const commonTypes = require('./types/common');
const deviceTypes = require('./types/device');
const scenarioTypes = require('./types/scenario');

const hubMethods = require('./methods/hub');
const accessoryMethods = require('./methods/accessory');
const scenarioMethods = require('./methods/scenario');
const roomMethods = require('./methods/room');
const systemMethods = require('./methods/system');

/**
 * Complete schema definition for SprutHub JSON-RPC API
 */
const sprutHubSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'SprutHub JSON-RPC API Schema',
  version: '1.0.0',
  description: 'Complete schema for SprutHub smart home system JSON-RPC API',
  
  // Type definitions
  definitions: {
    ...commonTypes,
    ...deviceTypes,
    ...scenarioTypes
  },

  // Method categories
  categories: {
    hub: {
      name: 'Hub Management',
      description: 'Methods for managing SprutHub devices and client connections'
    },
    accessory: {
      name: 'Device Control',
      description: 'Methods for controlling smart home devices and accessories'
    },
    scenario: {
      name: 'Scenario Management', 
      description: 'Methods for managing automation scenarios'
    },
    room: {
      name: 'Room Management',
      description: 'Methods for managing rooms and zones'
    },
    system: {
      name: 'System Information',
      description: 'High-level system information and aggregated data'
    }
  },

  // All available methods
  methods: {
    ...hubMethods,
    ...accessoryMethods,
    ...scenarioMethods,
    ...roomMethods,
    ...systemMethods
  }
};

/**
 * Get schema for a specific method
 * @param {string} methodName - The method name (e.g., 'hub.list')
 * @returns {object|null} Method schema or null if not found
 */
function getMethodSchema(methodName) {
  return sprutHubSchema.methods[methodName] || null;
}

/**
 * Get all methods in a category
 * @param {string} category - The category name (e.g., 'hub')
 * @returns {object} Object containing all methods in the category
 */
function getMethodsByCategory(category) {
  const methods = {};
  Object.keys(sprutHubSchema.methods).forEach(methodName => {
    const method = sprutHubSchema.methods[methodName];
    if (method.category === category) {
      methods[methodName] = method;
    }
  });
  return methods;
}

/**
 * Get list of all available methods
 * @returns {string[]} Array of method names
 */
function getAvailableMethods() {
  return Object.keys(sprutHubSchema.methods);
}

/**
 * Get list of all categories
 * @returns {string[]} Array of category names
 */
function getCategories() {
  return Object.keys(sprutHubSchema.categories);
}

/**
 * Get type definition
 * @param {string} typeName - The type name (e.g., 'Accessory')
 * @returns {object|null} Type definition or null if not found
 */
function getTypeDefinition(typeName) {
  return sprutHubSchema.definitions[typeName] || null;
}

module.exports = {
  schema: sprutHubSchema,
  getMethodSchema,
  getMethodsByCategory,
  getAvailableMethods,
  getCategories,
  getTypeDefinition
};