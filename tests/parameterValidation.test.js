const ParameterValidator = require('../src/utils/parameterValidator');

describe('ParameterValidator with AJV', () => {
  let validator;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    validator = new ParameterValidator(mockLogger);
  });

  describe('Type Coercion', () => {
    test('should coerce number to string', () => {
      const schema = {
        type: 'object',
        properties: {
          index: { type: 'string' },
        },
      };

      const requestData = { index: 100 };
      const result = validator.validateAndCoerce({ params: schema }, requestData);

      expect(result.isValid).toBe(true);
      expect(result.coercedData.index).toBe('100');
      expect(result.errors).toHaveLength(0);
    });

    test('should handle anyOf union types', () => {
      const schema = {
        type: 'object',
        properties: {
          index: {
            anyOf: [{ type: 'number' }, { type: 'string' }],
          },
        },
      };

      // Test with number
      let result = validator.validateAndCoerce({ params: schema }, { index: 95 });
      expect(result.isValid).toBe(true);
      expect(result.coercedData.index).toBe(95);

      // Test with a string that can be coerced to a number
      result = validator.validateAndCoerce({ params: schema }, { index: '95' });
      expect(result.isValid).toBe(true);
      expect(result.coercedData.index).toBe(95);

      // Test with a non-numeric string
      result = validator.validateAndCoerce({ params: schema }, { index: 'abc' });
      expect(result.isValid).toBe(true);
      expect(result.coercedData.index).toBe('abc');
    });

    test('should coerce boolean values', () => {
      const schema = {
        type: 'object',
        properties: {
          active: { type: 'boolean' },
        },
      };

      let result = validator.validateAndCoerce({ params: schema }, { active: 'true' });
      expect(result.coercedData.active).toBe(true);

      result = validator.validateAndCoerce({ params: schema }, { active: 'false' });
      expect(result.coercedData.active).toBe(false);

      result = validator.validateAndCoerce({ params: schema }, { active: 1 });
      expect(result.coercedData.active).toBe(true);

      result = validator.validateAndCoerce({ params: schema }, { active: 0 });
      expect(result.coercedData.active).toBe(false);
    });
  });

  describe('Validation Errors', () => {
    test('should detect missing required properties', () => {
      const schema = {
        type: 'object',
        properties: {
          get: {
            type: 'object',
            properties: {
              index: { type: 'string' },
            },
            required: ['index'],
          },
        },
        required: ['get'],
      };

      const result = validator.validateAndCoerce({ params: schema }, { get: {} });

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('must have required property');
      expect(result.errors[0].instancePath).toBe('/get');
    });

    test('should detect type mismatches', () => {
      const schema = {
        type: 'object',
        properties: {
          data: { type: 'object' },
        },
      };

      const result = validator.validateAndCoerce({ params: schema }, { data: 'not an object' });

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('must be object');
      expect(result.errors[0].instancePath).toBe('/data');
    });

    test('should format validation errors properly', () => {
      const errors = [
        { instancePath: '/get', message: "must have required property 'index'" },
        { instancePath: '/expand', message: 'must be string' },
      ];

      const formatted = validator.formatValidationErrors(errors);

      expect(formatted).toContain('Parameter validation errors:');
      expect(formatted).toContain('- /get: must have required property \'index\'');
      expect(formatted).toContain('- /expand: must be string');
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined values by removing them', () => {
      const schema = {
        type: 'object',
        properties: {
          optional: { type: 'string' },
        },
      };

      const result = validator.validateAndCoerce({ params: schema }, { optional: undefined });

      expect(result.isValid).toBe(true);
      expect(result.coercedData).toEqual({});
    });

    test('should handle empty schema', () => {
      const result = validator.validateAndCoerce({}, { any: 'data' });

      expect(result.isValid).toBe(true);
      expect(result.coercedData).toEqual({ any: 'data' });
    });

    test('should handle invalid schema gracefully', () => {
      const result = validator.validateAndCoerce(null, { data: 'test' });

      expect(result.isValid).toBe(true);
      expect(result.coercedData).toEqual({ data: 'test' });
    });
  });
});