# Sprut.hub Client

A WebSocket client library for communicating with [Sprut.hub](https://spruthub.ru/) smart home ecosystem. Provides both client functionality and comprehensive JSON-RPC API schema definitions for building integrations.

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
console.log(methods); // ['hub.list', 'accessory.list', 'accessory.search', 'scenario.get', ...]

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
- `searchAccessories(options)`: Search and filter accessories with advanced filtering for MCP server usage
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

### Enhanced Methods for MCP Server Integration

The library includes enhanced client-side methods optimized for MCP (Model Context Protocol) server usage, providing intelligent filtering and search capabilities.

#### accessory.search - Smart Accessory Filtering

Perfect for natural language queries like "turn on the chandelier in the hall":

```javascript
const result = await client.callMethod('accessory.search', {
  // Room filtering
  roomName: 'зал',              // Find by room name (auto-resolves to room ID)
  roomId: 13,                   // Or filter by specific room ID
  
  // Text search
  search: 'люстра',             // Search accessory names (case-insensitive)
  
  // Device properties
  manufacturer: 'Xiaomi',       // Filter by manufacturer
  model: 'Smart Light',         // Filter by device model
  online: true,                 // Only online devices
  virtual: false,               // Exclude virtual devices
  
  // Service/Characteristic filtering
  serviceType: 'Lightbulb',     // Filter by service type
  characteristicType: 'On',     // Filter by characteristic type
  writable: true,               // Only devices with writable characteristics
  
  // Performance controls
  expand: 'characteristics',    // Expansion level: none, services, characteristics
  page: 1,                      // Pagination
  limit: 10                     // Items per page
});

console.log(result.data);
// {
//   accessories: [...],         // Filtered and paginated results
//   total: 174,                 // Total accessories in system
//   filtered: 5,                // Accessories matching filters
//   page: 1, limit: 10,
//   hasNextPage: false,         // Pagination navigation flags
//   hasPreviousPage: false,
//   totalPages: 1,
//   expand: 'characteristics',
//   appliedFilters: {           // Summary of applied filters
//     roomFilter: 'зал (ID: 13)',
//     searchFilter: 'люстра',
//     serviceTypeFilter: 'Lightbulb',
//     writableFilter: true
//   }
// }
```

**Key Benefits:**
- **Dramatic performance improvement**: No need to load thousands of accessories
- **Smart room lookup**: Automatic room name to ID resolution
- **MCP-optimized**: Perfect for natural language processing
- **Rich metadata**: Complete filtering and pagination information
- **REST endpoint**: Available at `GET /accessories/search`

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