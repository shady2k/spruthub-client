const Ajv = require('ajv');

class ParameterValidator {
  constructor(logger) {
    this.log = logger;
    this.ajv = new Ajv({
      allErrors: true,
      coerceTypes: true,
      useDefaults: true,
      removeAdditional: 'failing',
    });
  }

  validateAndCoerce(methodSchema, requestData) {
    if (!methodSchema || !methodSchema.params) {
      return {
        isValid: true,
        coercedData: requestData,
        errors: [],
      };
    }

    try {
      const validate = this.ajv.compile(methodSchema.params);
      const data = { ...requestData };
      const isValid = validate(data);

      return {
        isValid,
        coercedData: data,
        errors: validate.errors || [],
      };
    } catch (error) {
      this.log?.debug('Parameter validation error:', error);
      return {
        isValid: false,
        coercedData: requestData,
        errors: [{ message: `Validation failed: ${error.message}` }],
      };
    }
  }

  formatValidationErrors(errors) {
    if (!errors || errors.length === 0) {
      return '';
    }

    return `Parameter validation errors:\n${errors
      .map(err => `  - ${err.instancePath || 'root'}: ${err.message}`)
      .join('\n')}`;
  }
}

module.exports = ParameterValidator;
