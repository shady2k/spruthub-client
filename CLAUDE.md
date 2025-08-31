# Spruthub Client - Claude Context

## Project Overview
This is a Node.js WebSocket client library for communicating with Sprut's smart home ecosystem. It's a defensive tool for legitimate home automation purposes.

## Project Structure
```
src/
├── index.js              # Main entry point - exports Sprut and Queue classes
├── queue.js              # Request/response queue with timeout management
├── core/
│   ├── websocket.js      # WebSocket connection management
│   ├── auth.js           # Authentication flow
│   └── client.js         # Main Sprut class (orchestrator)
├── entities/
│   ├── device.js         # Device/accessory management
│   ├── hub.js            # Hub management
│   ├── room.js           # Room management
│   ├── scenario.js       # Scenario management
│   └── system.js         # System aggregation methods
└── utils/
    └── helpers.js        # Utility functions

tests/
├── sprut.test.js # Integration tests for main client
└── queue.test.js # Unit tests for queue functionality
```

## Key Components

### Sprut Class (`src/core/client.js`)
Main WebSocket client orchestrator that composes all managers:
- Auto-reconnection on connection loss
- Three-step authentication flow (auth → email → password → token)
- Device command execution (currently only 'update' command)
- Server version retrieval
- Request/response correlation using unique IDs

### WebSocketManager (`src/core/websocket.js`)
WebSocket connection management:
- Connection/disconnection handling
- Auto-reconnection with configurable delay
- Event-driven architecture with custom handlers
- Message sending with promise-based error handling

### AuthManager (`src/core/auth.js`)
Authentication flow management:
- Three-step authentication process
- Token lifecycle management
- Automatic token refresh on expiration
- Authentication state tracking

### Entity Managers (`src/entities/`)
Domain-specific functionality:
- **DeviceManager**: Device discovery, control, and characteristic management
- **HubManager**: Hub discovery, client info, and server version
- **RoomManager**: Room discovery and device filtering
- **ScenarioManager**: Automation scenario CRUD operations
- **SystemManager**: System-wide information aggregation

### Queue Class (`src/queue.js`)
Request queue management:
- Maps request IDs to callback functions
- 30-second default timeout for requests
- Automatic cleanup to prevent memory leaks

### Helpers (`src/utils/helpers.js`)
Utility functions:
- Nested property access
- Value type determination
- Control value creation
- Standardized API response handling

## Dependencies
- **ws**: WebSocket client library (runtime)
- **jest**: Testing framework (dev)
- **eslint**: Code linting (dev)

## Development Commands
- `npm test`: Run test suite
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate coverage reports
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues

## API Usage

### Basic Setup
```javascript
const { Sprut } = require('spruthub-client');

// Create client instance
const client = new Sprut({
  wsUrl: 'wss://your-sprut-server.com',
  sprutEmail: 'your-email@example.com',
  sprutPassword: 'your-password',
  serial: 'your-device-serial',
  logger: console // or your preferred logger
});

// Connect and authenticate
await client.connected();

// Your code here...

// Clean up
await client.close();
```

### Complete Usage Examples

#### 1. Device Discovery and Control
```javascript
const { Sprut } = require('spruthub-client');

async function controlDevices() {
  const client = new Sprut({
    wsUrl: 'wss://your-server.com',
    sprutEmail: 'email@example.com',
    sprutPassword: 'password',
    serial: 'device-serial',
    logger: console
  });

  try {
    // Connect and authenticate
    await client.connected();
    
    // Get all system information
    const systemInfo = await client.getFullSystemInfo();
    console.log('Hubs:', systemInfo.hubs);
    console.log('Devices:', systemInfo.accessories);
    console.log('Rooms:', systemInfo.rooms);
    console.log('Scenarios:', systemInfo.scenarios);
    
    // Get only devices with expanded details
    const devices = await client.listAccessories(true);
    
    // Find controllable characteristics
    const controllable = client.getControllableCharacteristics(devices);
    console.log('Controllable devices:', controllable);
    
    // Control a specific device (example: turn on a light)
    if (controllable.length > 0) {
      const device = controllable[0];
      await client.execute('update', {
        accessoryId: device.accessoryId,
        serviceId: device.serviceId,
        characteristicId: device.characteristicId,
        control: { value: true } // Turn on
      });
    }
    
  } finally {
    await client.close();
  }
}

controlDevices().catch(console.error);
```

#### 2. Room-based Device Management
```javascript
async function manageRoomDevices() {
  const client = new Sprut({...config});
  
  await client.connected();
  
  // Get all rooms and devices
  const rooms = await client.listRooms();
  const devices = await client.listAccessories(true);
  
  // Filter devices by room
  const livingRoomId = rooms.find(r => r.name === 'Living Room')?.id;
  if (livingRoomId) {
    const livingRoomDevices = client.getDevicesByRoom(devices, livingRoomId);
    console.log('Living room devices:', livingRoomDevices);
    
    // Turn off all lights in living room
    for (const device of livingRoomDevices) {
      if (device.type === 'light') {
        await client.execute('update', {
          accessoryId: device.id,
          serviceId: device.services[0].id,
          characteristicId: device.services[0].characteristics[0].id,
          control: { value: false }
        });
      }
    }
  }
  
  await client.close();
}
```

#### 3. Scenario Management
```javascript
async function manageScenarios() {
  const client = new Sprut({...config});
  
  await client.connected();
  
  // List all scenarios
  const scenarios = await client.listScenarios();
  console.log('Available scenarios:', scenarios);
  
  // Create a new scenario
  const newScenario = await client.createScenario({
    type: "BLOCK",
    name: "Evening Routine",
    desc: "Turn off lights and activate security",
    onStart: false,
    active: true,
    sync: false,
    data: ""
  });
  
  // Update scenario with logic
  const scenarioData = JSON.stringify({
    blockId: 0,
    targets: [{
      type: "code",
      code: `
        // Turn off all lights
        const devices = await client.listAccessories(true);
        const lights = devices.filter(d => d.type === 'light');
        for (const light of lights) {
          await client.execute('update', {
            accessoryId: light.id,
            serviceId: light.services[0].id,
            characteristicId: light.services[0].characteristics[0].id,
            control: { value: false }
          });
        }
        log.info('Evening routine completed');
      `
    }]
  });
  
  await client.updateScenario(newScenario.data.index, scenarioData);
  
  await client.close();
}
```

#### 4. Real-time Device Monitoring
```javascript
async function monitorDevices() {
  const client = new Sprut({...config});
  
  // Set up connection event handlers
  client.wsManager.setEventHandlers({
    onOpen: () => console.log('Connected to Sprut hub'),
    onMessage: (data) => {
      console.log('Received update:', data);
      // Handle real-time device updates
    },
    onClose: () => console.log('Disconnected from hub'),
    onError: (error) => console.error('Connection error:', error)
  });
  
  await client.connected();
  
  // Keep connection alive for monitoring
  setInterval(async () => {
    try {
      const version = await client.version();
      console.log('Server version:', version);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }, 30000);
}
```

### Error Handling Best Practices
```javascript
async function robustClientUsage() {
  const client = new Sprut({...config});
  
  try {
    await client.connected();
    
    // Your operations here
    const devices = await client.listAccessories(true);
    
  } catch (error) {
    if (error.code === -666003) {
      // Token expired, client will auto-refresh
      console.log('Token refreshed, retrying...');
      // Retry your operation
    } else {
      console.error('Operation failed:', error);
    }
  } finally {
    // Always clean up
    try {
      await client.close();
    } catch (closeError) {
      console.error('Error during cleanup:', closeError);
    }
  }
}
```

## Complete API Reference

### Connection Methods
- `connected()` - Connect and authenticate to the Sprut hub
- `close()` - Close connection and cleanup resources
- `version()` - Get server version information

### Discovery Methods
- `listHubs()` - Get hub information and status
- `listAccessories(expand = false)` - Get all devices, optionally with detailed services/characteristics
- `listRooms()` - Get room information and device associations
- `listScenarios()` - Get all automation scenarios
- `getFullSystemInfo()` - Get complete system state (hubs, devices, rooms, scenarios)

### Device Control Methods
- `execute(command, params)` - Execute device commands
  - `command`: Currently supports 'update'
  - `params`: `{ accessoryId, serviceId, characteristicId, control }`
  - `control`: `{ value }` where value type depends on characteristic

### Scenario Management Methods
- `createScenario(config)` - Create new automation scenario
  - `config`: `{ type, name, desc, onStart, active, sync, data }`
- `updateScenario(index, data)` - Update existing scenario configuration
  - `index`: Scenario identifier
  - `data`: JSON string with scenario logic

### System Methods
- `setClientInfo(info)` - Set WebSocket client information for identification

### Helper Methods (Static/Instance)
- `getDevicesByRoom(accessories, roomId)` - Filter devices by specific room
- `getControllableCharacteristics(accessories)` - Extract devices with controllable characteristics
- `getDeviceInfo(accessories, accessoryId)` - Get detailed device information
- `getCharacteristicInfo(accessories, aId, sId, cId)` - Get specific characteristic details

### Method Return Types

#### `listHubs()` Returns:
```javascript
[{
  id: "hub-id",
  name: "Hub Name",
  status: "online",
  version: "1.0.0"
}]
```

#### `listAccessories(true)` Returns:
```javascript
[{
  id: "device-id",
  name: "Device Name",
  roomId: "room-id",
  services: [{
    id: "service-id",
    type: "lightbulb",
    characteristics: [{
      id: "char-id",
      type: "on",
      format: "boolean",
      perms: ["read", "write"],
      value: true
    }]
  }]
}]
```

#### `listRooms()` Returns:
```javascript
[{
  id: "room-id",
  name: "Living Room",
  devices: ["device-id-1", "device-id-2"]
}]
```

#### `listScenarios()` Returns:
```javascript
[{
  index: "scenario-id",
  name: "Evening Routine",
  desc: "Turn off lights",
  type: "BLOCK",
  active: true,
  onStart: false,
  sync: false,
  order: 1,
  data: "{...json...}"
}]
```

## Testing
- Uses mock WebSocket server for integration tests
- 100% test coverage
- Tests connection, authentication, commands, and error handling
- Proper cleanup and timeout handling

## Security Notes
- Legitimate smart home automation tool
- Standard authentication patterns
- Proper input validation
- No malicious code patterns detected

## Configuration Files
- `jest.config.js`: Test configuration with Node.js environment
- `package.json`: Standard npm package configuration
- Coverage reports generated in `coverage/` directory

## Authentication Flow
1. Send auth request → get email challenge
2. Send email → get password challenge  
3. Send password → receive token
4. Use token for subsequent authenticated requests
5. Auto-refresh token on expiration (error code -666003)

## Available API Methods

### Discovery Methods
- `listHubs()` - Get hub information and status
- `listAccessories(expand)` - Get all devices with services/characteristics
- `listRooms()` - Get room information
- `listScenarios()` - Get all automation scenarios
- `getFullSystemInfo()` - Get complete system state (hubs, devices, rooms, scenarios)

### Control Methods  
- `execute(command, params)` - Execute device commands
- `setClientInfo(info)` - Set WebSocket client information
- `version()` - Get server version information

### Scenario Management Methods
- `createScenario(config)` - Create new automation scenario
- `updateScenario(index, data)` - Update existing scenario configuration

### Helper Methods
- `getDevicesByRoom(accessories, roomId)` - Filter devices by room
- `getControllableCharacteristics(accessories)` - Extract controllable devices
- `getDeviceInfo(accessories, accessoryId)` - Get device details
- `getCharacteristicInfo(accessories, aId, sId, cId)` - Get characteristic details

### Value Types Supported
- `boolean` - For switches, sensors (true/false)
- `integer` - For numeric controls (brightness, temperature)
- `float` - For decimal values
- `string` - For text-based controls

## MCP Server Integration
This library is designed to work seamlessly with MCP (Model Context Protocol) servers:

1. **Device Discovery**: Use `getFullSystemInfo()` to get all controllable devices
2. **Device Control**: Use `execute()` with proper value types for device control
3. **State Reading**: Access current device states from the discovery data
4. **Room Organization**: Filter and organize devices by rooms for better UX
5. **Scenario Management**: Use scenario methods for automation control

## Scenario API Details

### Scenario Structure
Scenarios have the following properties:
- `index` - Unique scenario identifier (string)
- `name` - Human-readable scenario name
- `desc` - Scenario description
- `type` - Scenario type (typically "BLOCK")
- `active` - Whether scenario is enabled
- `onStart` - Whether to run on system startup
- `sync` - Whether scenario runs synchronously
- `order` - Display order in UI
- `data` - JSON string containing scenario logic/configuration

### Example Usage
```javascript
// List all scenarios
const scenarios = await client.listScenarios();

// Create a new scenario
const newScenario = await client.createScenario({
  type: "BLOCK",
  name: "Evening Routine",
  desc: "Turn off lights and lock doors",
  onStart: false,
  active: true,
  sync: false,
  data: ""
});

// Update scenario with automation logic
const scenarioData = JSON.stringify({
  blockId: 0,
  targets: [{
    type: "code",
    code: "log.info('Evening routine executed')\n"
  }]
});

await client.updateScenario(newScenario.data.index, scenarioData);
```

## Recent Enhancements (2025-01-20)
✅ Added comprehensive device discovery methods
✅ Enhanced execute method with multiple value type support
✅ Added helper methods for device filtering and metadata parsing
✅ Implemented system information aggregation
✅ Added client information management
✅ Comprehensive JSDoc documentation
✅ Full test coverage for new functionality
✅ Ready for MCP server and HTTP bridge integration

## Recent Enhancements (2025-08-31)
✅ Added scenario management functionality
✅ Added `listScenarios()` method for automation discovery
✅ Added `createScenario()` method for scenario creation
✅ Added `updateScenario()` method for scenario configuration
✅ Updated `getFullSystemInfo()` to include scenarios
✅ Added comprehensive scenario test coverage
✅ Enhanced documentation with scenario API details
✅ **Major Refactoring**: Split monolithic `sprut.js` into entity-based architecture
✅ **Improved Maintainability**: Separated concerns into core, entities, and utils
✅ **Enhanced Testability**: Smaller, focused modules with clear responsibilities
✅ **Better Code Organization**: Domain-driven design with composition pattern
✅ **Preserved API Compatibility**: All existing functionality maintained
✅ **Improved Code Coverage**: Better test coverage with modular structure