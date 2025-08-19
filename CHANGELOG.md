# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-08-19

### Added
- Initial release of spruthub-client
- WebSocket client for communicating with Sprut smart home ecosystem
- Support for device command execution (`execute` method)
- Server version retrieval (`version` method)
- Automatic authentication and token management
- Connection management with auto-reconnect
- Queue-based request/response handling with timeouts

### Features
- Promise-based API
- Configurable logger support (pino-compatible)
- Error handling and retry logic
- Clean connection close functionality