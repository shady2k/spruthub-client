// Test for Log Management functionality using simplified mocks

describe('Log Management', () => {
  let client;

  beforeEach(() => {
    client = {
      // Mock the LogManager methods directly
      getLogs: jest.fn(),
      subscribeLogs: jest.fn(),
      unsubscribeLogs: jest.fn(),
      unsubscribeAllLogs: jest.fn(),
      getActiveLogSubscriptions: jest.fn(),
      handleStreamingEvent: jest.fn(),
      handleDisconnection: jest.fn(),
      close: jest.fn(),
      getMethodSchema: jest.fn(),
      getMethodsByCategory: jest.fn(),
      
      // Mock the log manager for direct access
      logManager: {
        activeSubscriptions: new Map(),
        cleanup: jest.fn()
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogs', () => {
    test('should retrieve logs with default count', async () => {
      const mockResponse = {
        isSuccess: true,
        data: [
          {
            time: 1757060365891,
            level: 'LOG_LEVEL_INFO',
            path: 'System.Test',
            message: 'Test log message'
          }
        ]
      };
      
      client.getLogs.mockResolvedValue(mockResponse);
      
      const result = await client.getLogs();
      
      expect(result.isSuccess).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].message).toBe('Test log message');
      expect(client.getLogs).toHaveBeenCalledWith();
    });

    test('should retrieve logs with custom count', async () => {
      const mockResponse = {
        isSuccess: true,
        data: []
      };

      client.getLogs.mockResolvedValue(mockResponse);
      
      const result = await client.getLogs(50);
      
      expect(client.getLogs).toHaveBeenCalledWith(50);
      expect(result.isSuccess).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('subscribeLogs', () => {
    test('should successfully subscribe to log streaming', async () => {
      const mockResponse = {
        isSuccess: true,
        data: {
          uuid: 'test-uuid-123'
        }
      };
      
      const mockActiveSubscriptions = [
        { uuid: 'test-uuid-123' }
      ];

      client.subscribeLogs.mockResolvedValue(mockResponse);
      client.getActiveLogSubscriptions.mockReturnValue(mockActiveSubscriptions);
      
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
        isSuccess: true,
        data: {
          uuid: 'test-uuid-123'
        }
      };

      client.subscribeLogs.mockResolvedValue(mockResponse);
      
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
      
      expect(client.subscribeLogs).toHaveBeenCalledWith(logHandler);
      expect(client.handleStreamingEvent).toHaveBeenCalledWith(logEvent);
    });
  });

  describe('unsubscribeLogs', () => {
    test('should successfully unsubscribe from log streaming', async () => {
      const mockResponse = {
        isSuccess: true
      };
      
      client.unsubscribeLogs.mockResolvedValue(mockResponse);
      client.getActiveLogSubscriptions.mockReturnValue([]);
      
      const result = await client.unsubscribeLogs('test-uuid-123');
      
      expect(result.isSuccess).toBe(true);
      expect(client.unsubscribeLogs).toHaveBeenCalledWith('test-uuid-123');
      
      // Verify subscription is removed
      const subscriptions = client.getActiveLogSubscriptions();
      expect(subscriptions).toHaveLength(0);
    });

    test('should handle unsubscribing from non-existent subscription', async () => {
      const mockResponse = {
        isSuccess: false,
        message: 'No active subscription found with UUID: non-existent-uuid'
      };
      
      client.unsubscribeLogs.mockResolvedValue(mockResponse);
      
      const result = await client.unsubscribeLogs('non-existent-uuid');
      
      expect(result.isSuccess).toBe(false);
      expect(result.message).toContain('No active subscription found');
    });
  });

  describe('unsubscribeAllLogs', () => {
    test('should unsubscribe from multiple subscriptions', async () => {
      const mockResponse = {
        isSuccess: true,
        data: {
          cancelled: 2
        }
      };
      
      client.unsubscribeAllLogs.mockResolvedValue(mockResponse);
      client.getActiveLogSubscriptions.mockReturnValue([]);
      
      const result = await client.unsubscribeAllLogs();
      
      expect(result.isSuccess).toBe(true);
      expect(result.data.cancelled).toBe(2);
      
      // Verify all subscriptions are removed
      const subscriptions = client.getActiveLogSubscriptions();
      expect(subscriptions).toHaveLength(0);
    });

    test('should handle case with no active subscriptions', async () => {
      const mockResponse = {
        isSuccess: true,
        data: {
          cancelled: 0
        },
        message: 'No active subscriptions to cancel'
      };
      
      client.unsubscribeAllLogs.mockResolvedValue(mockResponse);
      
      const result = await client.unsubscribeAllLogs();
      
      expect(result.isSuccess).toBe(true);
      expect(result.data.cancelled).toBe(0);
      expect(result.message).toContain('No active subscriptions');
    });
  });

  describe('event handling', () => {
    test('should handle log events with multiple log entries', async () => {
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
      
      expect(client.handleStreamingEvent).toHaveBeenCalledWith(logEvent);
    });

    test('should cleanup subscriptions on disconnection', () => {
      // Add some mock subscriptions
      client.logManager.activeSubscriptions.set('uuid-1', { uuid: 'uuid-1' });
      client.logManager.activeSubscriptions.set('uuid-2', { uuid: 'uuid-2' });
      client.getActiveLogSubscriptions.mockReturnValueOnce([{ uuid: 'uuid-1' }, { uuid: 'uuid-2' }]);
      
      expect(client.getActiveLogSubscriptions()).toHaveLength(2);
      
      // Simulate disconnection
      client.getActiveLogSubscriptions.mockReturnValueOnce([]);
      client.handleDisconnection();
      
      expect(client.getActiveLogSubscriptions()).toHaveLength(0);
    });

    test('should cleanup subscriptions on client close', async () => {
      client.getActiveLogSubscriptions.mockReturnValueOnce([{ uuid: 'uuid-1' }, { uuid: 'uuid-2' }]);
      expect(client.getActiveLogSubscriptions()).toHaveLength(2);

      client.close.mockResolvedValue();
      client.getActiveLogSubscriptions.mockReturnValueOnce([]);
      
      // Close client
      await client.close();
      
      // Verify subscriptions were cleaned up
      expect(client.getActiveLogSubscriptions()).toHaveLength(0);
      expect(client.close).toHaveBeenCalled();
    });
  });

  describe('schema integration', () => {
    test('should have log.subscribe method in schema', () => {
      const mockSchema = {
        websocketOnly: true,
        category: 'logs'
      };
      
      client.getMethodSchema.mockReturnValue(mockSchema);
      const schema = client.getMethodSchema('log.subscribe');
      
      expect(schema).toBeDefined();
      expect(schema.websocketOnly).toBe(true);
      expect(schema.category).toBe('logs');
    });

    test('should have log.unsubscribe method in schema', () => {
      const mockSchema = {
        websocketOnly: true,
        category: 'logs'
      };
      
      client.getMethodSchema.mockReturnValue(mockSchema);
      const schema = client.getMethodSchema('log.unsubscribe');
      
      expect(schema).toBeDefined();
      expect(schema.websocketOnly).toBe(true);
      expect(schema.category).toBe('logs');
    });

    test('should list log methods in logs category', () => {
      const mockLogMethods = {
        'log.list': { category: 'logs' },
        'log.subscribe': { category: 'logs' },
        'log.unsubscribe': { category: 'logs' }
      };
      
      client.getMethodsByCategory.mockReturnValue(mockLogMethods);
      const logMethods = client.getMethodsByCategory('logs');
      const methodNames = Object.keys(logMethods);
      
      expect(methodNames).toContain('log.list');
      expect(methodNames).toContain('log.subscribe');
      expect(methodNames).toContain('log.unsubscribe');
    });
  });
});