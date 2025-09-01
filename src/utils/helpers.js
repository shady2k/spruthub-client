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

    // Handle JSON-RPC error responses
    if (result.error) {
      return {
        isSuccess: false,
        code: result.error.code || -1,
        message: result.error.message || 'Unknown error',
        data: result.error.data || null
      };
    }

    // Handle successful JSON-RPC responses
    if (result.result) {
      // Extract the actual data from the nested JSON-RPC result structure
      let data = null;
      
      if (nestedPath && nestedPath.length > 0) {
        // Try to extract nested data using the provided path
        data = this.getNestedProperty(result.result, nestedPath);
        
        // If nested data has a string 'data' property, try to parse it as JSON
        if (data && data.data && typeof data.data === 'string') {
          try {
            data.data = JSON.parse(data.data);
          } catch (e) {
            logger.warn('Failed to parse nested data as JSON:', data.data);
          }
        }
      } else {
        // Use the entire result as data
        data = result.result;
      }

      return {
        isSuccess: true,
        code: 0,
        message: 'Success',
        data: data
      };
    }

    // Fallback for unexpected response format
    return {
      isSuccess: false,
      code: -1,
      message: 'Unexpected response format',
      data: result
    };
  }
}

module.exports = Helpers;