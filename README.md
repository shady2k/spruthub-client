# Sprut Client

A WebSocket client library for communicating with Sprut's smart home ecosystem.

## Installation

```bash
npm install spruthub-client
```

## Usage

```javascript
const { Sprut } = require('spruthub-client');

// Create logger (using pino or similar)
const logger = require('pino')();

// Initialize client
const client = new Sprut({
  wsUrl: 'wss://your-sprut-server.com',
  sprutEmail: 'your-email@example.com',
  sprutPassword: 'your-password',
  serial: 'device-serial-number',
  logger: logger
});

// Wait for connection
await client.connected();

// Execute device command
const result = await client.execute('update', {
  accessoryId: 'accessory-id',
  serviceId: 'service-id', 
  characteristicId: 'characteristic-id',
  control: { value: true }
});

// Get server version
const version = await client.version();

// Close connection
await client.close();
```

## API

### Constructor Options

- `wsUrl`: WebSocket URL of Sprut server
- `sprutEmail`: Authentication email
- `sprutPassword`: Authentication password  
- `serial`: Device serial number
- `logger`: Logger instance (pino-compatible)

### Methods

- `connected()`: Promise that resolves when WebSocket is connected
- `execute(command, params)`: Execute device command
- `version()`: Get server version information
- `close()`: Close WebSocket connection

## License

MIT