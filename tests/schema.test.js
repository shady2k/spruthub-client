const { Schema } = require('../src');

describe('SprutHub Schema System', () => {
  describe('Schema Structure', () => {
    test('should have complete schema structure', () => {
      expect(Schema.schema).toBeDefined();
      expect(Schema.schema.title).toBe('SprutHub JSON-RPC API Schema');
      expect(Schema.schema.version).toBe('1.0.0');
      expect(Schema.schema.definitions).toBeDefined();
      expect(Schema.schema.categories).toBeDefined();
      expect(Schema.schema.methods).toBeDefined();
    });

    test('should have all categories', () => {
      const categories = Schema.getCategories();
      expect(categories).toContain('hub');
      expect(categories).toContain('accessory');
      expect(categories).toContain('scenario');
      expect(categories).toContain('room');
      expect(categories).toContain('system');
    });

    test('should have methods in each category', () => {
      const hubMethods = Schema.getMethodsByCategory('hub');
      expect(Object.keys(hubMethods)).toContain('hub.list');
      expect(Object.keys(hubMethods)).toContain('server.clientInfo');

      const accessoryMethods = Schema.getMethodsByCategory('accessory');
      expect(Object.keys(accessoryMethods)).toContain('accessory.list');
      expect(Object.keys(accessoryMethods)).toContain('characteristic.update');

      const scenarioMethods = Schema.getMethodsByCategory('scenario');
      expect(Object.keys(scenarioMethods)).toContain('scenario.list');
      expect(Object.keys(scenarioMethods)).toContain('scenario.create');
    });
  });

  describe('Method Discovery', () => {
    test('should list all available methods', () => {
      const methods = Schema.getAvailableMethods();
      expect(Array.isArray(methods)).toBe(true);
      expect(methods.length).toBeGreaterThan(0);
      
      // Check for key methods
      expect(methods).toContain('hub.list');
      expect(methods).toContain('accessory.list');
      expect(methods).toContain('characteristic.update');
      expect(methods).toContain('scenario.list');
      expect(methods).toContain('scenario.create');
      expect(methods).toContain('scenario.update');
      expect(methods).toContain('scenario.delete');
    });

    test('should return method schema for valid method', () => {
      const methodSchema = Schema.getMethodSchema('accessory.list');
      expect(methodSchema).toBeDefined();
      expect(methodSchema.description).toBeDefined();
      expect(methodSchema.category).toBe('accessory');
      expect(methodSchema.params).toBeDefined();
      expect(methodSchema.result).toBeDefined();
      expect(methodSchema.examples).toBeDefined();
    });

    test('should return null for invalid method', () => {
      const methodSchema = Schema.getMethodSchema('invalid.method');
      expect(methodSchema).toBeNull();
    });
  });

  describe('Type Definitions', () => {
    test('should have common type definitions', () => {
      const jsonRpcResponse = Schema.getTypeDefinition('JsonRpcResponse');
      expect(jsonRpcResponse).toBeDefined();
      expect(jsonRpcResponse.type).toBe('object');
      expect(jsonRpcResponse.properties).toBeDefined();
      expect(jsonRpcResponse.properties.id).toBeDefined();
      expect(jsonRpcResponse.properties.jsonrpc).toBeDefined();
      expect(jsonRpcResponse.properties.result).toBeDefined();
    });

    test('should have device type definitions', () => {
      const accessory = Schema.getTypeDefinition('Accessory');
      expect(accessory).toBeDefined();
      expect(accessory.type).toBe('object');
      expect(accessory.properties).toBeDefined();
      expect(accessory.properties.id).toBeDefined();
      expect(accessory.properties.name).toBeDefined();
      expect(accessory.properties.online).toBeDefined();
    });

    test('should have scenario type definitions', () => {
      const scenario = Schema.getTypeDefinition('Scenario');
      expect(scenario).toBeDefined();
      expect(scenario.type).toBe('object');
      expect(scenario.properties).toBeDefined();
      expect(scenario.properties.index).toBeDefined();
      expect(scenario.properties.name).toBeDefined();
      expect(scenario.properties.type).toBeDefined();
    });

    test('should return null for invalid type', () => {
      const invalidType = Schema.getTypeDefinition('InvalidType');
      expect(invalidType).toBeNull();
    });
  });

  describe('Method Schemas Validation', () => {
    test('hub.list method should have correct structure', () => {
      const hubList = Schema.getMethodSchema('hub.list');
      expect(hubList.description).toContain('hub');
      expect(hubList.category).toBe('hub');
      expect(hubList.params.type).toBe('object');
      expect(hubList.params.properties.hub).toBeDefined();
      expect(hubList.result.type).toBe('object');
    });

    test('characteristic.update method should have correct structure', () => {
      const charUpdate = Schema.getMethodSchema('characteristic.update');
      expect(charUpdate.description).toContain('characteristic');
      expect(charUpdate.category).toBe('accessory');
      expect(charUpdate.params.properties.characteristic).toBeDefined();
      expect(charUpdate.params.properties.characteristic.properties.update).toBeDefined();
      expect(charUpdate.examples).toBeDefined();
      expect(charUpdate.examples.length).toBeGreaterThan(0);
    });

    test('scenario methods should have proper CRUD structure', () => {
      // Create
      const scenarioCreate = Schema.getMethodSchema('scenario.create');
      expect(scenarioCreate.params.properties.scenario.properties.create).toBeDefined();
      expect(scenarioCreate.params.properties.scenario.properties.create.properties.name).toBeDefined();

      // Read
      const scenarioGet = Schema.getMethodSchema('scenario.get');
      expect(scenarioGet.params.properties.scenario.properties.get).toBeDefined();
      expect(scenarioGet.params.properties.scenario.properties.get.properties.index).toBeDefined();

      // Update
      const scenarioUpdate = Schema.getMethodSchema('scenario.update');
      expect(scenarioUpdate.params.properties.scenario.properties.update).toBeDefined();
      expect(scenarioUpdate.params.properties.scenario.properties.update.properties.index).toBeDefined();
      expect(scenarioUpdate.params.properties.scenario.properties.update.properties.data).toBeDefined();

      // Delete
      const scenarioDelete = Schema.getMethodSchema('scenario.delete');
      expect(scenarioDelete.params.properties.scenario.properties.delete).toBeDefined();
      expect(scenarioDelete.params.properties.scenario.properties.delete.properties.index).toBeDefined();
    });
  });


  describe('Real-world Examples', () => {
    test('should have examples matching real device log patterns', () => {
      // Hub list example
      const hubList = Schema.getMethodSchema('hub.list');
      const hubExample = hubList.examples[0];
      expect(hubExample.request.params.hub.list).toEqual({});

      // Accessory list example 
      const accessoryList = Schema.getMethodSchema('accessory.list');
      const accessoryExample = accessoryList.examples[0];
      expect(accessoryExample.request.params.accessory.list.expand).toBe('services,characteristics');

      // Characteristic update example
      const charUpdate = Schema.getMethodSchema('characteristic.update');
      const charExample = charUpdate.examples[0];
      expect(charExample.request.params.characteristic.update.aId).toBeDefined();
      expect(charExample.request.params.characteristic.update.sId).toBeDefined();
      expect(charExample.request.params.characteristic.update.cId).toBeDefined();
      expect(charExample.request.params.characteristic.update.control.value.boolValue).toBe(true);

      // Scenario create example
      const scenarioCreate = Schema.getMethodSchema('scenario.create');
      const scenarioExample = scenarioCreate.examples[0];
      expect(scenarioExample.request.params.scenario.create.name).toBeDefined();
      expect(scenarioExample.request.params.scenario.create.type).toBe('BLOCK');
    });
  });

  describe('Schema Integration', () => {
    test('should maintain consistency between definitions and method schemas', () => {
      const accessoryType = Schema.getTypeDefinition('Accessory');
      const accessoryListMethod = Schema.getMethodSchema('accessory.list');

      // Check that result references the correct type
      expect(accessoryListMethod.result.properties.data.properties.accessories.items.$ref).toBe('#/definitions/Accessory');

      // Verify type has required properties
      expect(accessoryType.properties.id).toBeDefined();
      expect(accessoryType.properties.name).toBeDefined();
      expect(accessoryType.properties.online).toBeDefined();
    });
  });
});

describe('Error Code Mapping', () => {
  test('should have error codes defined', () => {
    const errorCodes = Schema.getTypeDefinition('ErrorCodes');
    expect(errorCodes).toBeDefined();
    expect(errorCodes['-666003']).toBe('Invalid or expired token');
    expect(errorCodes['-1']).toBe('General error');
    expect(errorCodes['0']).toBe('Success');
  });
});