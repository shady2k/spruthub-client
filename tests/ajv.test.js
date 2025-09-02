const Ajv = require('ajv');

describe('AJV behavior', () => {
  let ajv;

  beforeEach(() => {
    ajv = new Ajv({
      allErrors: true,
      coerceTypes: true,
      useDefaults: true,
      removeAdditional: 'failing',
    });
  });

  test('should handle anyOf with coercion', () => {
    const schema = {
      type: 'object',
      properties: {
        index: {
          anyOf: [{ type: 'number' }, { type: 'string' }],
        },
      },
    };

    const validate = ajv.compile(schema);
    const data = { index: 95 };
    const valid = validate(data);
    if (!valid) console.log(validate.errors);
    expect(valid).toBe(true);

    const data2 = { index: '95' };
    const valid2 = validate(data2);
    if (!valid2) console.log(validate.errors);
    expect(valid2).toBe(true);
    expect(data2.index).toBe(95);

    const data3 = { index: 'abc' };
    const valid3 = validate(data3);
    if (!valid3) console.log(validate.errors);
    expect(valid3).toBe(true);
    expect(data3.index).toBe('abc');
  });

  test('should handle nested anyOf with coercion', () => {
    const schema = {
      type: 'object',
      properties: {
        scenario: {
          type: 'object',
          properties: {
            delete: {
              type: 'object',
              properties: {
                index: {
                  anyOf: [{ type: 'number' }, { type: 'string' }],
                },
              },
              required: ['index'],
            },
          },
          required: ['delete'],
        },
      },
      required: ['scenario'],
    };

    const validate = ajv.compile(schema);

    let data1 = { scenario: { delete: { index: 95 } } };
    const valid1 = validate(data1);
    if (!valid1) console.log(validate.errors);
    expect(valid1).toBe(true);
    expect(data1.scenario.delete.index).toBe(95);

    let data2 = { scenario: { delete: { index: '95' } } };
    const valid2 = validate(data2);
    if (!valid2) console.log(validate.errors);
    expect(valid2).toBe(true);
    expect(data2.scenario.delete.index).toBe(95);
    
    let data3 = { scenario: { delete: { index: 'abc' } } };
    const valid3 = validate(data3);
    if (!valid3) console.log(validate.errors);
    expect(valid3).toBe(true);
    expect(data3.scenario.delete.index).toBe('abc');
  });
});
