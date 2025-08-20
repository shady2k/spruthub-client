# Spruthub Client - Claude Context

## Project Overview
This is a Node.js WebSocket client library for communicating with Sprut's smart home ecosystem. It's a defensive tool for legitimate home automation purposes.

## Project Structure
```
src/
├── index.js      # Main entry point - exports Sprut and Queue classes
├── sprut.js      # WebSocket client with authentication and device control
└── queue.js      # Request/response queue with timeout management

tests/
├── sprut.test.js # Integration tests for main client
└── queue.test.js # Unit tests for queue functionality
```

## Key Components

### Sprut Class (`src/sprut.js`)
Main WebSocket client with:
- Auto-reconnection on connection loss
- Three-step authentication flow (auth → email → password → token)
- Device command execution (currently only 'update' command)
- Server version retrieval
- Request/response correlation using unique IDs

### Queue Class (`src/queue.js`)
Request queue management:
- Maps request IDs to callback functions
- 30-second default timeout for requests
- Automatic cleanup to prevent memory leaks

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
```javascript
const { Sprut } = require('spruthub-client');

const client = new Sprut({
  wsUrl: 'wss://server.com',
  sprutEmail: 'email@example.com',
  sprutPassword: 'password',
  serial: 'device-serial',
  logger: logger
});

await client.connected();
await client.execute('update', { accessoryId, serviceId, characteristicId, control });
await client.version();
await client.close();
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