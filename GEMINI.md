# Gemini Code Assistant Context

This document provides context for the Gemini code assistant to understand the `spruthub-client` project.

## Project Overview

`spruthub-client` is a Node.js WebSocket client library for interacting with the Sprut.home smart home ecosystem. It allows developers to control and monitor smart devices connected to a Sprut.hub.

The core logic is implemented in `src/core/client.js`, which manages the WebSocket connection, authentication, and command execution. The library is structured into several modules:

-   `src/core`: Handles the main client logic, WebSocket connection, and authentication.
-   `src/entities`: Contains modules for managing different entities like devices, hubs, rooms, and scenarios.
-   `src/utils`: Provides helper functions.
-   `src/queue.js`: Manages the queue for asynchronous WebSocket messages.

The main entry point is `src/index.js`, which exports the `Sprut` client class.

## Building and Running

### Installation

To install the dependencies, run:

```bash
npm install
```

### Running Tests

The project uses Jest for testing. To run the tests, use:

```bash
npm test
```

To run tests in watch mode:

```bash
npm test:watch
```

To generate a test coverage report:

```bash
npm test:coverage
```

### Linting

The project uses ESLint for code linting. To check for linting errors, run:

```bash
npm run lint
```

To automatically fix linting errors:

```bash
npm run lint:fix
```

## API Reference

The `Sprut` class is the main entry point for interacting with the library.

### `new Sprut(options)`

Creates a new `Sprut` client instance.

**Options:**

-   `wsUrl` (string, required): The WebSocket URL of the Sprut.hub.
-   `sprutEmail` (string, required): The email address for authentication.
-   `sprutPassword` (string, required): The password for authentication.
-   `serial` (string, required): The serial number of the client device.
-   `logger` (object, required): A logger object (e.g., `pino` or `winston`).

### Sprut Client Methods

#### Connection

-   `connected()`: Returns a promise that resolves when the client is connected to the WebSocket server.
-   `close()`: Closes the WebSocket connection.

#### Hub Management (`hubManager`)

-   `listHubs()`: Retrieves a list of all hubs.
-   `setClientInfo(clientInfo)`: Sets the client information on the server.
-   `version()`: Retrieves the server version information.

#### Device Management (`deviceManager`)

-   `listAccessories(expand)`: Retrieves a list of all accessories (devices). The `expand` parameter can be used to include additional information, such as `services` and `characteristics`.
-   `execute(command, params)`: Executes a command on a device. The `command` is typically `'''update'''`. The `params` object should include `accessoryId`, `serviceId`, `characteristicId`, and `control` ({ `value`, `valueType` }).
-   `getControllableCharacteristics(accessories)`: Returns a list of all controllable characteristics from a list of accessories.
-   `getDeviceInfo(accessories, accessoryId)`: Returns detailed information for a specific device.
-g   `getCharacteristicInfo(accessories, accessoryId, serviceId, characteristicId)`: Returns detailed information for a specific characteristic.

#### Room Management (`roomManager`)

-   `listRooms()`: Retrieves a list of all rooms.
-   `getDevicesByRoom(accessories, roomId)`: Returns a list of devices in a specific room.

#### Scenario Management (`scenarioManager`)

-   `listScenarios()`: Retrieves a list of all scenarios.
-   `getScenario(index, expand)`: Retrieves a specific scenario by its index.
-   `createScenario(config)`: Creates a new scenario.
-   `updateScenario(index, data)`: Updates an existing scenario.
-   `deleteScenario(index)`: Deletes a scenario.

#### System Management (`systemManager`)

-   `getFullSystemInfo()`: Retrieves a comprehensive object containing all hubs, accessories, rooms, scenarios, and controllable devices.

## Usage Examples

### Basic Initialization

```javascript
const { Sprut } = require('spruthub-client');
const pino = require('pino');

const logger = pino();

const client = new Sprut({
  wsUrl: 'wss://your-sprut-hub-ws-url',
  sprutEmail: 'your-email@example.com',
  sprutPassword: 'your-password',
  serial: 'your-client-serial',
  logger: logger,
});

(async () => {
  await client.connected();
  console.log('Connected to Sprut.hub!');

  // You can now interact with the hub
  const version = await client.version();
  console.log('Server Version:', version.data);

  await client.close();
})();
```

### Controlling a Device

```javascript
(async () => {
  // ... (initialization)

  // List all accessories
  const accessoriesResult = await client.listAccessories();
  if (!accessoriesResult.isSuccess) {
    console.error('Failed to list accessories:', accessoriesResult.message);
    return;
  }
  const accessories = accessoriesResult.data;

  // Find a specific device and characteristic to control
  const controllable = client.getControllableCharacteristics(accessories);
  const lightSwitch = controllable.find(c => c.characteristicType === 'On');

  if (lightSwitch) {
    // Turn the light on
    await client.execute('update', {
      accessoryId: lightSwitch.accessoryId,
      serviceId: lightSwitch.serviceId,
      characteristicId: lightSwitch.characteristicId,
      control: { value: true },
    });
    console.log(`${lightSwitch.accessoryName} turned on.`);
  }

  await client.close();
})();
```

### Working with Rooms

```javascript
(async () => {
  // ... (initialization)

  const systemInfo = await client.getFullSystemInfo();

  if (systemInfo.errors.length > 0) {
    console.error('Errors fetching system info:', systemInfo.errors);
  }

  const livingRoom = systemInfo.rooms.find(r => r.name === 'Living Room');

  if (livingRoom) {
    const livingRoomDevices = client.getDevicesByRoom(systemInfo.accessories, livingRoom.id);
    console.log('Living Room Devices:', livingRoomDevices.map(d => d.name));
  }

  await client.close();
})();
```

## Development Conventions

### Coding Style

The project follows a consistent coding style enforced by ESLint. The ESLint configuration can be found in `.eslintrc.js`.

### Testing

Tests are located in the `tests/` directory and are written using the Jest framework. The main test file is `tests/sprut.test.js`, which uses a mock WebSocket server to test the client's functionality.

### Commits and Versioning

The project uses a `CHANGELOG.md` file to track changes between versions. Commit messages should be clear and descriptive.

### Dependencies

The project has a minimal set of dependencies:

-   `ws`: A WebSocket client library for Node.js.
-   `eslint`: For code linting.
-   `jest`: For testing.

The `package.json` file lists all the dependencies and development dependencies.