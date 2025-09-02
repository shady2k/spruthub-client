const ParameterValidator = require('../src/utils/parameterValidator');

describe('Integration Tests - Parameter Validation and Timeout Solution', () => {
  let validator;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    validator = new ParameterValidator(mockLogger);
  });

  describe('Scenario Index Type Coercion', () => {
    test('should solve the original problem - numeric index gets coerced to string', () => {
      // This test demonstrates the solution to the original issue:
      // {"scenario":{"get":{"index":100,"expand":"data"}}} (WRONG - hangs)
      // {"scenario":{"get":{"index":"100","expand":"data"}}} (CORRECT - works)

      // Simulate the scenario.get schema
      const scenarioGetSchema = {
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
                      type: 'string',
                      description: 'Scenario index/ID (string format)'
                    },
                    expand: { 
                      type: 'string',
                      description: 'Properties to expand (e.g., "data")',
                      default: 'data'
                    }
                  },
                  required: ['index']
                }
              },
              required: ['get']
            }
          },
          required: ['scenario']
        }
      };

      // Original problematic request data (numeric index)
      const problematicRequest = {
        scenario: {
          get: {
            index: 100, // This is a number, but should be a string
            expand: 'data'
          }
        }
      };

      // Validate and coerce
      const result = validator.validateAndCoerce(scenarioGetSchema, problematicRequest);

      // Verification: the solution works
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.coercedData.scenario.get.index).toBe('100'); // Coerced to string!
      expect(result.coercedData.scenario.get.expand).toBe('data'); // Unchanged

      // The coerced data can now be sent to Sprut.hub without causing silent rejection
      const coercedRequest = result.coercedData;
      expect(typeof coercedRequest.scenario.get.index).toBe('string');
    });

    test('should handle scenario.delete with anyOf union type', () => {
      // scenario.delete allows both number and string for index
      const scenarioDeleteSchema = {
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
                      anyOf: [
                        { type: 'number' },
                        { type: 'string' }
                      ],
                      description: 'Scenario index/ID to delete (can be numeric or string)'
                    }
                  },
                  required: ['index']
                }
              },
              required: ['delete']
            }
          },
          required: ['scenario']
        }
      };

      // Test with number (should be valid as-is)
      let result = validator.validateAndCoerce(scenarioDeleteSchema, {
        scenario: { delete: { index: 95 } }
      });
      expect(result.isValid).toBe(true);
      expect(result.coercedData.scenario.delete.index).toBe(95);

      // Test with string (should also be valid)
      result = validator.validateAndCoerce(scenarioDeleteSchema, {
        scenario: { delete: { index: '95' } }
      });
      expect(result.isValid).toBe(true);
      expect(result.coercedData.scenario.delete.index).toBe(95);
    });
  });

  describe('Error Prevention and Messaging', () => {
    test('should provide clear validation errors for truly invalid data', () => {
      const schema = {
        params: {
          type: 'object',
          properties: {
            scenario: {
              type: 'object',
              properties: {
                get: {
                  type: 'object',
                  properties: {
                    index: { type: 'string' }
                  },
                  required: ['index']
                }
              },
              required: ['get']
            }
          },
          required: ['scenario']
        }
      };

      // Completely invalid data that cannot be coerced
      const invalidRequest = {
        scenario: {
          get: {
            index: { invalid: 'object' } // Object cannot be coerced to string
          }
        }
      };

      const result = validator.validateAndCoerce(schema, invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const errorMessage = validator.formatValidationErrors(result.errors);
      expect(errorMessage).toContain('Parameter validation errors:');
      expect(errorMessage).toContain('must be string');
    });

    test('should handle missing required fields', () => {
      const schema = {
        params: {
          type: 'object',
          properties: {
            scenario: {
              type: 'object',
              properties: {
                get: {
                  type: 'object',
                  properties: {
                    index: { type: 'string' }
                  },
                  required: ['index']
                }
              },
              required: ['get']
            }
          },
          required: ['scenario']
        }
      };

      // Missing required index field
      const incompleteRequest = {
        scenario: {
          get: {} // Missing required 'index'
        }
      };

      const result = validator.validateAndCoerce(schema, incompleteRequest);

      expect(result.isValid).toBe(false);
      const errorMessage = validator.formatValidationErrors(result.errors);
      expect(errorMessage).toContain("must have required property 'index'");
    });
  });

  describe('Solution Benefits', () => {
    test('demonstrates complete solution workflow', () => {
      // This test shows how the complete solution works:
      
      // 1. Original problematic data
      const originalData = { scenario: { get: { index: 100 } } };
      
      // 2. Schema definition
      const schema = {
        params: {
          type: 'object',
          properties: {
            scenario: {
              type: 'object',
              properties: {
                get: {
                  type: 'object',
                  properties: { index: { type: 'string' } },
                  required: ['index']
                }
              },
              required: ['get']
            }
          },
          required: ['scenario']
        }
      };

      // 3. Validation and coercion
      const validation = validator.validateAndCoerce(schema, originalData);
      
      // 4. Results verification
      expect(validation.isValid).toBe(true);
      expect(validation.coercedData.scenario.get.index).toBe('100');
      
      // 5. This coerced data can now be safely sent to Sprut.hub
      //    without causing silent rejection and timeout
      const safeData = validation.coercedData;
      expect(typeof safeData.scenario.get.index).toBe('string');
      
      // 6. If there were validation errors in strict mode, 
      //    they would be caught before the network request
      //    preventing the silent timeout issue entirely
    });
  });
});
