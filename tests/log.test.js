const Sprut = require('../src/core/client');

// Mock WebSocket implementation
class MockWebSocket {
  constructor() {
    this.readyState = 1; // OPEN
    this.sentMessages = [];
    this.responseQueue = [];
    this.onmessage = null;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
  }
  
  send(message) {
    this.sentMessages.push(message);
    return Promise.resolve();
  }
  
  mockResponse(response) {
    this.responseQueue.push(response);
    // Simulate async response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify(response) });
      }
    }, 10);
  }
  
  close() {
    this.readyState = 3; // CLOSED
    return Promise.resolve();
  }
}

MockWebSocket.OPEN = 1;

describe('Log Management', () => {
  let client;
  let mockWS;

  beforeEach(() => {
    mockWS = new MockWebSocket();
    
    // Mock WebSocket constructor
    global.WebSocket = jest.fn(() => mockWS);
    
    client = new Sprut({
      wsUrl: 'ws://localhost:8080',
      sprutEmail: 'test@example.com',
      sprutPassword: 'password123',
      serial: 'TEST123',
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
    });
    
    // Mock successful connection
    client.wsManager.isConnected = true;
    client.wsManager.ws = mockWS;
    client.wsManager.isOpen = jest.fn(() => true);
    
    // Mock authentication
    client.authManager.getToken = jest.fn(() => 'mock-token');
    client.authManager.ensureAuthenticated = jest.fn(() => Promise.resolve());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogs', () => {
    test('should retrieve logs with default count', async () => {
      const mockResponse = {
        id: 1,
        result: {
          log: {
            list: {
              log: [
                {
                  time: 1757060365891,
                  level: 'LOG_LEVEL_INFO',
                  path: 'System.Test',
                  message: 'Test log message'
                }
              ]
            }
          }
        }
      };

      mockWS.mockResponse(mockResponse);
      
      const result = await client.getLogs();
      
      expect(result.isSuccess).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].message).toBe('Test log message');
    });

    test('should retrieve logs with custom count', async () => {
      const mockResponse = {
        id: 1,
        result: {
          log: {
            list: {
              log: []
            }
          }
        }
      };

      mockWS.mockResponse(mockResponse);
      
      await client.getLogs(50);
      
      const sentMessage = JSON.parse(mockWS.sentMessages[0]);
      expect(sentMessage.params.log.list.count).toBe(50);
    });
  });

  describe('subscribeLogs', () => {
    test('should successfully subscribe to log streaming', async () => {
      const mockResponse = {
        id: 1,
        result: {
          log: {
            subscribe: {
              uuid: 'test-uuid-123'
            }
          }
        }
      };

      mockWS.mockResponse(mockResponse);
      
      const result = await client.subscribeLogs();
      
      expect(result.isSuccess).toBe(true);
      expect(result.data.uuid).toBe('test-uuid-123');
      
      // Verify subscription is tracked
      const subscriptions = client.getActiveLogSubscriptions();
      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].uuid).toBe('test-uuid-123');
    });

    test('should register log event handler', async () => {
      const mockResponse = {
        id: 1,
        result: {
          log: {
            subscribe: {
              uuid: 'test-uuid-123'
            }
          }
        }
      };

      mockWS.mockResponse(mockResponse);
      
      const logHandler = jest.fn();
      await client.subscribeLogs(logHandler);
      
      // Simulate receiving a log event
      const logEvent = {
        event: {
          log: {
            log: [
              {
                time: 1757060365891,
                level: 'LOG_LEVEL_INFO',
                path: 'System.Test',
                message: 'Real-time log entry'
              }
            ]
          }
        }
      };

      client.handleStreamingEvent(logEvent);
      
      expect(logHandler).toHaveBeenCalledWith({
        subscriptionId: 'test-uuid-123',
        timestamp: 1757060365891,
        level: 'LOG_LEVEL_INFO',
        component: 'System.Test',
        message: 'Real-time log entry',
        raw: expect.any(Object)
      });
    });
  });

  describe('unsubscribeLogs', () => {
    test('should successfully unsubscribe from log streaming', async () => {
      // First subscribe
      const subscribeResponse = {
        id: 1,
        result: {
          log: {
            subscribe: {
              uuid: 'test-uuid-123'
            }
          }
        }
      };
      mockWS.mockResponse(subscribeResponse);
      await client.subscribeLogs();

      // Then unsubscribe
      const unsubscribeResponse = {
        id: 2,
        result: {
          log: {
            unsubscribe: {}
          }
        }
      };
      mockWS.mockResponse(unsubscribeResponse);
      
      const result = await client.unsubscribeLogs('test-uuid-123');
      
      expect(result.isSuccess).toBe(true);
      
      // Verify subscription is removed
      const subscriptions = client.getActiveLogSubscriptions();
      expect(subscriptions).toHaveLength(0);
    });

    test('should handle unsubscribing from non-existent subscription', async () => {
      const result = await client.unsubscribeLogs('non-existent-uuid');
      
      expect(result.isSuccess).toBe(false);
      expect(result.message).toContain('No active subscription found');
    });
  });

  describe('unsubscribeAllLogs', () => {
    test('should unsubscribe from multiple subscriptions', async () => {
      // Subscribe to multiple log streams
      const responses = [
        {
          id: 1,
          result: { log: { subscribe: { uuid: 'uuid-1' } } }
        },
        {
          id: 2,
          result: { log: { subscribe: { uuid: 'uuid-2' } } }
        }
      ];

      for (const response of responses) {
        mockWS.mockResponse(response);
        await client.subscribeLogs();
      }

      // Mock unsubscribe responses
      const unsubscribeResponses = [
        {
          id: 3,
          result: { log: { unsubscribe: {} } }
        },
        {
          id: 4,
          result: { log: { unsubscribe: {} } }
        }
      ];

      for (const response of unsubscribeResponses) {
        mockWS.mockResponse(response);
      }
      
      const result = await client.unsubscribeAllLogs();
      
      expect(result.isSuccess).toBe(true);
      expect(result.data.cancelled).toBe(2);
      
      // Verify all subscriptions are removed
      const subscriptions = client.getActiveLogSubscriptions();
      expect(subscriptions).toHaveLength(0);
    });

    test('should handle case with no active subscriptions', async () => {
      const result = await client.unsubscribeAllLogs();
      
      expect(result.isSuccess).toBe(true);
      expect(result.data.cancelled).toBe(0);
      expect(result.message).toContain('No active subscriptions');
    });
  });

  describe('event handling', () => {
    test('should handle log events with multiple log entries', async () => {
      // Subscribe first
      const subscribeResponse = {
        id: 1,
        result: {
          log: {
            subscribe: {
              uuid: 'test-uuid-123'
            }
          }
        }
      };
      mockWS.mockResponse(subscribeResponse);
      
      const logHandler = jest.fn();
      await client.subscribeLogs(logHandler);
      
      // Simulate receiving multiple log entries in one event
      const logEvent = {
        event: {
          log: {
            log: [
              {
                time: 1757060365891,
                level: 'LOG_LEVEL_INFO',
                path: 'System.Test1',
                message: 'First log entry'
              },
              {
                time: 1757060365892,
                level: 'LOG_LEVEL_ERROR',
                path: 'System.Test2',
                message: 'Second log entry'
              }
            ]
          }
        }
      };

      client.handleStreamingEvent(logEvent);
      
      expect(logHandler).toHaveBeenCalledTimes(2);
      expect(logHandler).toHaveBeenNthCalledWith(1, expect.objectContaining({
        message: 'First log entry',
        level: 'LOG_LEVEL_INFO'
      }));
      expect(logHandler).toHaveBeenNthCalledWith(2, expect.objectContaining({
        message: 'Second log entry',
        level: 'LOG_LEVEL_ERROR'
      }));
    });

    test('should cleanup subscriptions on disconnection', () => {
      // Add some mock subscriptions
      client.logManager.activeSubscriptions.set('uuid-1', { uuid: 'uuid-1' });
      client.logManager.activeSubscriptions.set('uuid-2', { uuid: 'uuid-2' });
      
      expect(client.getActiveLogSubscriptions()).toHaveLength(2);
      
      // Simulate disconnection
      client.handleDisconnection();
      
      expect(client.getActiveLogSubscriptions()).toHaveLength(0);
    });

    test('should cleanup subscriptions on client close', async () => {
      // Subscribe to multiple log streams
      const responses = [
        {
          id: 1,
          result: { log: { subscribe: { uuid: 'uuid-1' } } }
        },
        {
          id: 2,
          result: { log: { subscribe: { uuid: 'uuid-2' } } }
        }
      ];

      for (const response of responses) {
        mockWS.mockResponse(response);
        await client.subscribeLogs();
      }

      expect(client.getActiveLogSubscriptions()).toHaveLength(2);

      // Mock unsubscribe responses for cleanup
      const unsubscribeResponses = [
        {
          id: 3,
          result: { log: { unsubscribe: {} } }
        },
        {
          id: 4,
          result: { log: { unsubscribe: {} } }
        }
      ];

      for (const response of unsubscribeResponses) {
        mockWS.mockResponse(response);
      }

      // Mock close method
      client.wsManager.close = jest.fn(() => Promise.resolve());
      
      // Close client
      await client.close();
      
      // Verify subscriptions were cleaned up
      expect(client.getActiveLogSubscriptions()).toHaveLength(0);
      expect(client.wsManager.close).toHaveBeenCalled();
    });
  });

  describe('schema integration', () => {
    test('should have log.subscribe method in schema', () => {
      const schema = client.getMethodSchema('log.subscribe');
      
      expect(schema).toBeDefined();
      expect(schema.websocketOnly).toBe(true);
      expect(schema.category).toBe('logs');
    });

    test('should have log.unsubscribe method in schema', () => {
      const schema = client.getMethodSchema('log.unsubscribe');
      
      expect(schema).toBeDefined();
      expect(schema.websocketOnly).toBe(true);
      expect(schema.category).toBe('logs');
    });

    test('should list log methods in logs category', () => {
      const logMethods = client.getMethodsByCategory('logs');
      const methodNames = Object.keys(logMethods);
      
      expect(methodNames).toContain('log.list');
      expect(methodNames).toContain('log.subscribe');
      expect(methodNames).toContain('log.unsubscribe');
    });
  });
});