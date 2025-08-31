class Helpers {
  static getNestedProperty(obj, path, defaultValue) {
    return path.reduce(
      (acc, key) => (acc && acc[key] ? acc[key] : defaultValue),
      obj
    );
  }

  static determineValueType(value) {
    if (typeof value === 'boolean') {
      return 'bool';
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'float';
    }
    return 'string';
  }

  static createControlValue(value, valueType) {
    const controlValue = {};
    
    // Set the appropriate value type based on input
    switch (valueType) {
      case 'bool':
      case 'boolean':
        controlValue.boolValue = Boolean(value);
        break;
      case 'int':
      case 'integer':
      case 'number':
        controlValue.intValue = parseInt(value, 10);
        break;
      case 'float':
      case 'double':
        controlValue.floatValue = parseFloat(value);
        break;
      case 'string':
      default:
        controlValue.stringValue = String(value);
        break;
    }

    return controlValue;
  }

  static handleApiResponse(result, nestedPath, logger, successMessage) {
    logger.info(result, successMessage);

    if (result.error) {
      return {
        isSuccess: false,
        ...result.error,
      };
    }

    if (result.result) {
      // Handle both formats: direct result or nested result
      const nestedResult = this.getNestedProperty(result.result, nestedPath);
      if (nestedResult) {
        return {
          isSuccess: true,
          code: 0,
          message: "Success",
          data: nestedResult,
        };
      } else {
        return result.result;
      }
    }

    return result;
  }
}

module.exports = Helpers;