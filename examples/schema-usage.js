/**
 * Example demonstrating how to use the SprutHub Schema System
 * This shows how consuming applications can discover and use API methods
 */

const { Schema } = require('../src');

async function demonstrateSchemaUsage() {
  console.log('=== SprutHub Schema System Demo ===\n');

  // 1. Basic Schema Information
  console.log('1. Basic Schema Information:');
  console.log(`Schema Title: ${Schema.schema.title}`);
  console.log(`Schema Version: ${Schema.schema.version}`);
  console.log(`Available Categories: ${Schema.getCategories().join(', ')}`);
  console.log(`Total Methods: ${Schema.getAvailableMethods().length}\n`);

  // 2. Method Discovery
  console.log('2. Available Methods by Category:');
  Schema.getCategories().forEach(category => {
    const methods = Schema.getMethodsByCategory(category);
    console.log(`  ${category}: ${Object.keys(methods).join(', ')}`);
  });
  console.log();

  // 3. Method Details
  console.log('3. Method Details Example (accessory.list):');
  const accessoryList = Schema.getMethodSchema('accessory.list');
  console.log(`  Description: ${accessoryList.description}`);
  console.log(`  Category: ${accessoryList.category}`);
  console.log(`  Has Examples: ${accessoryList.examples?.length > 0 ? 'Yes' : 'No'}`);
  console.log(`  Parameters Required: ${accessoryList.params.required?.join(', ') || 'None'}`);
  console.log();

  // 4. Type Information
  console.log('4. Type Definitions:');
  const accessoryType = Schema.getTypeDefinition('Accessory');
  if (accessoryType && accessoryType.properties) {
    const properties = Object.keys(accessoryType.properties);
    console.log(`  Accessory properties: ${properties.slice(0, 5).join(', ')}... (${properties.length} total)`);
  }
  console.log();

  // 5. Real Usage Pattern
  console.log('5. Real Usage Pattern:');
  
  // For framework integration, you might validate requests:
  const exampleRequest = {
    accessory: {
      list: {
        expand: 'services,characteristics'
      }
    }
  };
  
  console.log('  Example request structure:');
  console.log('  ', JSON.stringify(exampleRequest, null, 2));
  console.log();

  // 6. Raw Schema Data Access
  console.log('6. Raw Schema Data Access:');
  console.log('  Access to raw schema data for custom transformations:');
  console.log(`    Schema has ${Object.keys(Schema.schema.definitions).length} type definitions`);
  console.log(`    Schema has ${Object.keys(Schema.schema.methods).length} method definitions`);
  console.log(`    Schema has ${Object.keys(Schema.schema.categories).length} categories`);
  console.log();
  
  console.log('  Example method schema structure:');
  const sampleMethod = Schema.getMethodSchema('accessory.list');
  console.log('    {');
  console.log(`      description: "${sampleMethod.description}",`);
  console.log(`      method: "${sampleMethod.method}",`);
  console.log(`      category: "${sampleMethod.category}",`);
  console.log(`      params: { ... },`);
  console.log(`      result: { ... },`);
  console.log(`      examples: [${sampleMethod.examples?.length || 0} examples]`);
  console.log('    }');
  console.log();

  // 7. Integration with Client
  console.log('7. Schema Integration with Client:');
  console.log('   If you had a connected Sprut client:');
  console.log('   const client = new Sprut(options);');
  console.log('   client.getAvailableMethods(); // Same as Schema.getAvailableMethods()');
  console.log('   client.getMethodSchema("accessory.list"); // Same as Schema.getMethodSchema()');
  console.log();

  // 8. Framework Adapter Pattern
  console.log('8. Framework Adapter Pattern:');
  console.log('   For building REST APIs or other adapters:');
  console.log();
  
  // Example of how sprut-http-bridge could use this
  console.log('   // Example: Auto-generate Express routes');
  console.log('   Schema.getAvailableMethods().forEach(methodName => {');
  console.log('     const schema = Schema.getMethodSchema(methodName);');
  console.log('     console.log(`   Route: ${methodName} -> ${schema.category}`);');
  console.log('   });');
  console.log();
  
  Schema.getAvailableMethods().slice(0, 5).forEach(methodName => {
    const schema = Schema.getMethodSchema(methodName);
    console.log(`   Route: ${methodName} -> ${schema.category}`);
  });
  console.log('   ... and more');
  console.log();

  console.log('=== Demo Complete ===');
  console.log('The schema system enables:');
  console.log('- API discovery and documentation');
  console.log('- Request validation');
  console.log('- Framework-agnostic integration');
  console.log('- Raw schema data for custom transformations');
  console.log('- Type-safe development through schema definitions');
}

// Run the demo
if (require.main === module) {
  demonstrateSchemaUsage().catch(console.error);
}

module.exports = { demonstrateSchemaUsage };
