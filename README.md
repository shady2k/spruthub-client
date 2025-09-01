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

// Get server version
const version = await client.version();

// Close connection
await client.close();
```

### Schema System for API Discovery

```javascript
const { Schema } = require('spruthub-client');

// Get all available methods
const methods = Schema.getAvailableMethods();
console.log(methods); // ['hub.list', 'accessory.list', 'scenario.get', ...]

// Get schema for specific method
const updateSchema = Schema.getMethodSchema('characteristic.update');
console.log(updateSchema); // Full JSON schema definition

// Get methods by category
const accessoryMethods = Schema.getMethodsByCategory('accessory');

// Get type definition
const accessoryType = Schema.getTypeDefinition('Accessory');
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

- `connected()`: Promise that resolves when WebSocket is connected
- `execute(command, params)`: Execute device command
- `version()`: Get server version information
- `listHubs()`: List all available hubs
- `listAccessories(expand)`: List all accessories with optional expansion
- `listRooms()`: List all rooms
- `getScenario(id, expand)`: Get scenario by ID
- `getFullSystemInfo()`: Get complete system information
- `close()`: Close WebSocket connection

### Schema System

#### Methods

- `Schema.getAvailableMethods()`: Get array of all method names
- `Schema.getMethodSchema(methodName)`: Get schema for specific method
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

This library provides raw schema definitions that can be used to build framework-specific integrations:

```javascript
const { Schema } = require('spruthub-client');

// Build your own REST API routes
Schema.getAvailableMethods().forEach(method => {
  const schema = Schema.getMethodSchema(method);
  // Transform to your framework's format
  // Create validation middleware
  // Generate route handlers
});
```

## License

MIT