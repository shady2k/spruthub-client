# Sprut.hub Client

A WebSocket client library for communicating with [Sprut.hub](https://spruthub.ru/) smart home ecosystem. Provides both client functionality and comprehensive JSON-RPC API schema definitions for building integrations.

## Recent Changes (v1.2.6+)

- **REST Schema Generation**: Methods now include a `rest` property to map JSON-RPC methods to RESTful endpoints.
- **REST Method Discovery**: Added a `Schema.getRestMethods()` function to easily retrieve all methods with REST mappings.
- **Standardized API Response Format**: All client methods now return consistent `{ isSuccess, code, message, data }` structure
- **Improved Error Handling**: Unified error handling across all managers using `Helpers.handleApiResponse`
- **Schema Alignment**: Updated schema definitions to reflect actual API response structures with data wrapper objects
- **Code Quality Improvements**: Removed empty SystemManager class, fixed code duplication, added missing method delegation, implemented WebSocket event handlers, resolved all linting issues

## Installation

```bash
npm install spruthub-client
```

## Usage

### Basic Client Usage

```javascript
const { Sprut } = require('spruthub-client');

// Create logger (using pino or similar)
const logger = require('pino')();

// Initialize client
const client = new Sprut({
  wsUrl: 'wss://your-spruthub-server.com',
  sprutEmail: 'your-email@example.com',
  sprutPassword: 'your-password',
  serial: 'device-serial-number',
  logger: logger
});

// Wait for connection
await client.connected();

// Execute device command
const result = await client.execute('characteristic.update', {
  aId: 'accessory-id',
  sId: 'service-id', 
  cId: 'characteristic-id',
  control: { value: { boolValue: true } }
});
console.log(result); // { isSuccess: true, code: 0, message: "Success", data: {...} }

// Get server version
const version = await client.version();
console.log(version); // { isSuccess: true, code: 0, message: "Success", data: {...} }

// Close connection
await client.close();
```

### Schema System for API Discovery

The library includes a powerful schema system for API discovery, validation, and integration.

Each method schema now includes a `rest` property if it has a corresponding RESTful mapping.

```javascript
const { Schema } = require('spruthub-client');

// Get all available methods
const methods = Schema.getAvailableMethods();
console.log(methods); // ['hub.list', 'accessory.list', 'scenario.get', ...]

// Get schema for specific method
const updateSchema = Schema.getMethodSchema('characteristic.update');
console.log(updateSchema.rest); // { method: 'PATCH', path: '/characteristics' }

// Discover all REST-enabled methods
const restMethods = Schema.getRestMethods();
console.log(restMethods);
// [
//   {
//     methodName: 'hub.list',
//     httpMethod: 'GET',
//     path: '/hubs',
//     schema: { ... }
//   },
//   ...
// ]
```

## API

### Sprut.hub Client

#### Constructor Options

- `wsUrl`: WebSocket URL of Sprut.hub server
- `sprutEmail`: Authentication email
- `sprutPassword`: Authentication password  
- `serial`: Device serial number
- `logger`: Logger instance (pino-compatible)

#### Methods

All methods return standardized response format: `{ isSuccess, code, message, data }`

- `connected()`: Promise that resolves when WebSocket is connected
- `execute(command, params)`: Execute device command
- `version()`: Get server version information
- `listHubs()`: List all available hubs
- `listAccessories(expand)`: List all accessories with optional expansion
- `listRooms()`: List all rooms
- `getRoom(roomId)`: Get specific room by ID
- `getScenario(id, expand)`: Get scenario by ID
- `listScenarios()`: List all scenarios
- `createScenario(scenarioData)`: Create new scenario
- `updateScenario(id, scenarioData)`: Update existing scenario

- `close()`: Close WebSocket connection

#### Response Format

All API methods return a consistent response structure:

```javascript
{
  isSuccess: boolean,  // true for successful operations
  code: number,        // 0 for success, error codes for failures
  message: string,     // Human-readable status message
  data: object|array   // Response payload (null for errors)
}
```

### Schema System

#### Methods

- `Schema.getAvailableMethods()`: Get array of all method names
- `Schema.getMethodSchema(methodName)`: Get schema for specific method
- `Schema.getRestMethods()`: Get an array of all methods with REST mappings.
- `Schema.getMethodsByCategory(category)`: Get all methods in a category
- `Schema.getCategories()`: Get list of all categories
- `Schema.getTypeDefinition(typeName)`: Get type definition

#### Categories

- `hub`: Hub management methods
- `accessory`: Device control methods
- `scenario`: Scenario management methods
- `room`: Room management methods
- `system`: System information methods

## Framework Integration

This library provides schema definitions that can be used to dynamically build framework-specific integrations, such as a REST bridge.

```javascript
const { Schema } = require('spruthub-client');
const fastify = require('fastify')();

// Use getRestMethods() to automatically generate routes
const restMethods = Schema.getRestMethods();

console.log('Dynamically generating REST routes...');

restMethods.forEach(route => {
  const { httpMethod, path, schema } = route;
  
  console.log(`  -> Registering: ${httpMethod} ${path}`);
  
  fastify[httpMethod.toLowerCase()](path, async (request, reply) => {
    // In a real application, you would:
    // 1. Validate request.params, request.query, and request.body against the schema
    // 2. Construct the parameters for the JSON-RPC call
    // 3. Call the Sprut.hub client
    // 4. Transform the response to match the RESTful API structure
    
    return { 
      message: `Route for ${schema.method} is running`, 
      requestParams: request.params,
      requestQuery: request.query,
      requestBody: request.body
    };
  });
});

// Example output:
// Dynamically generating REST routes...
//   -> Registering: GET /hubs
//   -> Registering: POST /server/client-info
//   -> Registering: GET /accessories
//   -> Registering: PATCH /characteristics
//   ... and so on
```

## License

MIT