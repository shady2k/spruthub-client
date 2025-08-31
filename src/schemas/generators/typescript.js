/**
 * TypeScript definitions generator for SprutHub API
 */

/**
 * Generate TypeScript definitions from SprutHub schema
 * @param {object} sprutSchema - The complete SprutHub schema
 * @returns {string} TypeScript definitions
 */
function generateTypeScriptDefinitions(sprutSchema) {
  let typescript = '';
  
  // Header
  typescript += `/**
 * TypeScript definitions for SprutHub JSON-RPC API
 * Generated from schema version ${sprutSchema.version}
 */

`;

  // Generate type definitions
  typescript += '// Base Types\n';
  typescript += generateTypesSection(sprutSchema.definitions);
  
  // Generate method interfaces
  typescript += '\n// Method Interfaces\n';
  typescript += generateMethodInterfaces(sprutSchema.methods);
  
  // Generate main client interface
  typescript += '\n// Main Client Interface\n';
  typescript += generateClientInterface(sprutSchema.methods);
  
  return typescript;
}

/**
 * Generate TypeScript types from schema definitions
 * @param {object} definitions - Schema definitions
 * @returns {string} TypeScript type definitions
 */
function generateTypesSection(definitions) {
  let typescript = '';
  
  Object.entries(definitions).forEach(([name, definition]) => {
    if (name === 'ErrorCodes') {
      // Handle error codes as const
      typescript += `export const ${name} = {\n`;
      Object.entries(definition).forEach(([code, message]) => {
        typescript += `  '${code}': '${message}',\n`;
      });
      typescript += '} as const;\n\n';
    } else {
      typescript += `export interface ${name} ${convertToTypeScriptType(definition)}\n\n`;
    }
  });
  
  return typescript;
}

/**
 * Convert schema definition to TypeScript type
 * @param {object} definition - Schema definition
 * @returns {string} TypeScript type
 */
function convertToTypeScriptType(definition) {
  if (definition.type === 'object' && definition.properties) {
    let typescript = '{\n';
    
    Object.entries(definition.properties).forEach(([propName, propDef]) => {
      const optional = definition.required && !definition.required.includes(propName) ? '?' : '';
      const description = propDef.description ? `  /** ${propDef.description} */\n` : '';
      typescript += `${description}  ${propName}${optional}: ${convertPropertyToTypeScript(propDef)};\n`;
    });
    
    typescript += '}';
    return typescript;
  }
  
  if (definition.oneOf) {
    return definition.oneOf.map(convertPropertyToTypeScript).join(' | ');
  }
  
  if (definition.type === 'array' && definition.items) {
    return `${convertPropertyToTypeScript(definition.items)}[]`;
  }
  
  return convertPropertyToTypeScript(definition);
}

/**
 * Convert property definition to TypeScript type
 * @param {object} propDef - Property definition
 * @returns {string} TypeScript type
 */
function convertPropertyToTypeScript(propDef) {
  if (propDef.$ref) {
    return propDef.$ref.replace('#/definitions/', '');
  }
  
  if (propDef.oneOf) {
    return propDef.oneOf.map(convertPropertyToTypeScript).join(' | ');
  }
  
  if (propDef.type === 'array' && propDef.items) {
    return `${convertPropertyToTypeScript(propDef.items)}[]`;
  }
  
  if (propDef.type === 'object' && propDef.properties) {
    return convertToTypeScriptType(propDef);
  }
  
  if (propDef.enum) {
    return propDef.enum.map(value => `'${value}'`).join(' | ');
  }
  
  switch (propDef.type) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'integer': return 'number';
    case 'boolean': return 'boolean';
    case 'array': return 'any[]';
    case 'object': return 'Record<string, any>';
    default: return 'any';
  }
}

/**
 * Generate method interfaces
 * @param {object} methods - Method definitions
 * @returns {string} TypeScript method interfaces
 */
function generateMethodInterfaces(methods) {
  let typescript = '';
  
  Object.entries(methods).forEach(([methodName, methodSchema]) => {
    const interfaceName = methodName.replace('.', '').replace(/^[a-z]/, c => c.toUpperCase());
    
    // Parameters interface
    typescript += `export interface ${interfaceName}Params ${convertToTypeScriptType(methodSchema.params)}\n\n`;
    
    // Result interface
    typescript += `export interface ${interfaceName}Result ${convertToTypeScriptType(methodSchema.result)}\n\n`;
  });
  
  return typescript;
}

/**
 * Generate main client interface
 * @param {object} methods - Method definitions
 * @returns {string} TypeScript client interface
 */
function generateClientInterface(methods) {
  let typescript = `export interface SprutHubClient {
  // Connection methods
  connected(): Promise<void>;
  close(): Promise<void>;

  // Schema methods
  getSchema(): object;
  getAvailableMethods(): string[];
  getMethodSchema(methodName: string): object | null;
  getMethodsByCategory(category: string): object;
  getCategories(): string[];
  getTypeDefinition(typeName: string): object | null;

  // API methods
`;

  Object.entries(methods).forEach(([methodName, methodSchema]) => {
    const interfaceName = methodName.replace('.', '').replace(/^[a-z]/, c => c.toUpperCase());
    const jsMethodName = convertMethodNameToJavaScript(methodName);
    
    typescript += `  /** ${methodSchema.description} */\n`;
    
    if (methodSchema.category === 'system' && jsMethodName === 'getFullSystemInfo') {
      typescript += `  ${jsMethodName}(): Promise<${interfaceName}Result>;\n`;
    } else if (methodName === 'accessory.list') {
      typescript += `  listAccessories(expand?: string): Promise<${interfaceName}Result>;\n`;
    } else if (methodName === 'characteristic.update') {
      typescript += `  execute(command: 'update', params: { accessoryId: number; serviceId: number; characteristicId: number; control: { value: any; valueType?: string } }): Promise<${interfaceName}Result>;\n`;
    } else {
      // Generate based on existing method patterns
      const paramType = methodSchema.params ? `params: ${interfaceName}Params` : '';
      typescript += `  ${jsMethodName}(${paramType}): Promise<${interfaceName}Result>;\n`;
    }
  });

  // Add helper methods
  typescript += `
  // Helper methods
  getControllableCharacteristics(accessories: Accessory[]): ControllableCharacteristic[];
  getDeviceInfo(accessories: Accessory[], accessoryId: number): Accessory | null;
  getCharacteristicInfo(accessories: Accessory[], accessoryId: number, serviceId: number, characteristicId: number): object | null;
  getDevicesByRoom(accessories: Accessory[], roomId: number): Accessory[];
`;

  typescript += '}\n';
  
  return typescript;
}

/**
 * Convert JSON-RPC method name to JavaScript method name
 * @param {string} methodName - JSON-RPC method name
 * @returns {string} JavaScript method name
 */
function convertMethodNameToJavaScript(methodName) {
  const mapping = {
    'hub.list': 'listHubs',
    'server.clientInfo': 'setClientInfo',
    'accessory.list': 'listAccessories',
    'characteristic.update': 'execute',
    'scenario.list': 'listScenarios',
    'scenario.get': 'getScenario',
    'scenario.create': 'createScenario',
    'scenario.update': 'updateScenario',
    'scenario.delete': 'deleteScenario',
    'room.list': 'listRooms',
    'system.getFullInfo': 'getFullSystemInfo',
    'system.version': 'version'
  };
  
  return mapping[methodName] || methodName.replace('.', '');
}

module.exports = {
  generateTypeScriptDefinitions
};