# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
- `npm test` - Run all tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage reports (same as `npm test`)
- Run single test: `npx jest tests/schema.test.js`
- Run specific test pattern: `npx jest --testNamePattern="Schema Structure"`

### Code Quality
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run prepublishOnly` - Run lint and tests before publishing


## Architecture Overview

### Core Client Architecture
The library follows a modular manager-based architecture centered around the main `Sprut` client class:

**Main Client (`src/core/client.js`)**
- Central orchestrator that initializes and coordinates all managers
- Handles WebSocket lifecycle, authentication flow, and message routing
- Maintains request queue for JSON-RPC call/response matching

**Manager Pattern**
All functionality is split into specialized managers:
- `WebSocketManager` - WebSocket connection lifecycle
- `AuthManager` - Authentication with Sprut.hub servers
- `DeviceManager` - Device/accessory operations
- `HubManager` - Hub management operations and system information
- `RoomManager` - Room/zone management
- `ScenarioManager` - Automation scenario CRUD operations

**Queue System (`src/queue.js`)**
- Maps JSON-RPC request IDs to callback functions
- Handles automatic timeout cleanup (30s default)
- Enables async/await pattern over WebSocket transport

### Schema System Architecture

**Framework-Agnostic Design**
The schema system is designed to provide raw schema data without opinionated transformations:

**Schema Organization (`src/schemas/`)**
- `types/` - JSON Schema type definitions (common, device, scenario)
- `methods/` - Method definitions organized by category (hub, accessory, room, scenario, system)
- `enhanced/` - Enhanced client-side method schemas (e.g., accessory search with filtering)
- `index.js` - Main schema API with discovery methods

**Key Schema APIs**
- `Schema.getAvailableMethods()` - Returns all method names
- `Schema.getMethodSchema(methodName)` - Get complete method definition
- `Schema.getMethodsByCategory(category)` - Filter methods by category
- `Schema.getTypeDefinition(typeName)` - Get type definitions
- `Schema.getCategories()` - List all categories

### Entity Managers
Each entity manager follows the same pattern:
- Constructor receives `callMethod`, `ensureConnectionAndAuth`, and `logger`
- Methods handle parameter validation and response parsing via `Helpers.handleApiResponse`
- All methods ensure connection/auth before making calls
- **Recent Refactoring**: Standardized response handling across all managers using `Helpers.handleApiResponse` for consistent `{ isSuccess, code, message, data }` format

### JSON-RPC Method Structure
Methods follow Sprut.hub's nested parameter structure:
```javascript
{
  [category]: {
    [action]: {
      // parameters
    }
  }
}
```

Example: `characteristic.update` uses:
```javascript
{
  characteristic: {
    update: {
      aId: 'accessory-id',
      sId: 'service-id', 
      cId: 'characteristic-id',
      control: { value: { boolValue: true } }
    }
  }
}
```

## Important Implementation Notes

### Schema System Usage
- The library provides raw schema data for framework integration
- Consumers should build their own transformations (OpenAPI, TypeScript, etc.)
- Schema discovery enables automatic API route generation
- All method schemas include parameter validation, result types, and real examples

### WebSocket Connection Management
- Client automatically handles reconnection with exponential backoff
- Authentication is automatically renewed on reconnection
- All managers ensure connection/auth before making calls

### Error Handling
- Uses Sprut.hub error codes (defined in schema types)
- `Helpers.handleApiResponse` standardizes response parsing across managers
- Connection errors trigger automatic reconnection attempts
- **Recent Enhancement**: Improved `handleApiResponse` to handle nested JSON-RPC responses and ensure consistent error/success format

### Testing Structure
- Tests organized in `tests/` directory with dedicated `tests/enhanced/` for enhanced methods
- Schema tests validate method definitions and type consistency  
- Client tests use mocked WebSocket for isolation
- Enhanced method tests use direct method testing approach for reliability
- Coverage reports generated in `coverage/` directory
- **Recent Updates**: Tests updated to validate new standardized response format across all methods  
- **Enhanced Methods Testing**: Comprehensive test suite for `accessory.search` with 14 test cases covering all filtering scenarios
- **Current Test Coverage**: 80 passing tests across 8 test suites with 77% code coverage

### Recent Code Quality Improvements (2024)

**Cleanup and Bug Fixes:**
- Removed empty `SystemManager` class - functionality consolidated into `HubManager`
- Added missing `getRoom(roomId)` method delegation to main client class
- Eliminated code duplication by removing `_getNestedProperty()` from AuthManager (now uses `Helpers.getNestedProperty()`)
- Implemented meaningful WebSocket event handlers (connection logging and token cleanup)
- Fixed linting errors in examples and schema files
- All tests passing with improved code coverage

### Enhanced Methods System (2025)

**New Client-Side Processing Architecture:**
- Enhanced methods are defined with `enhanced: true` flag in their schemas
- Implementations in `src/enhanced/` directory provide client-side processing
- The client's `callMethod` intelligently dispatches to enhanced implementations vs. JSON-RPC methods
- Perfect for MCP server integration requiring smart filtering without massive data transfers

**Current Enhanced Methods:**
- `accessory.search` - Advanced filtering and pagination with room lookup, text search, device properties, and service/characteristic filtering
- Includes pagination navigation flags (`hasNextPage`, `hasPreviousPage`, `totalPages`)
- Smart room name to ID resolution using `room.list` integration
- REST endpoint: `GET /accessories/search`

**Enhanced Methods Benefits:**
- **Performance**: Client-side filtering reduces server load and data transfer
- **MCP Integration**: Optimized for natural language queries like "turn on chandelier in hall"
- **Extensibility**: Framework for adding more client-side enhancements
- **Consistency**: Enhanced methods follow same schema and response patterns as core methods

### Response Format Standardization (Recent Refactor)
All client methods now return a consistent response structure:
```javascript
{
  isSuccess: boolean,  // true for successful operations
  code: number,        // 0 for success, error codes for failures
  message: string,     // Human-readable status message
  data: object|array   // Response payload (null for errors)
}
```

This standardization involved:
- Refactoring all entity managers to use `Helpers.handleApiResponse`
- Updating schema definitions to reflect actual API response structures
- Ensuring proper extraction of nested JSON-RPC response data
- Consolidating system functionality into HubManager (SystemManager was removed as empty class)
- Implementing meaningful WebSocket event handlers for better connection management