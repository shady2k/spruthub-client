const accessorySearchMethod = require('../../src/enhanced/accessory')['accessory.search'];

describe('Enhanced Method: accessory.search - Core Functionality', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      callMethod: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Parameter Validation', () => {
    test('should validate page parameter', async () => {
      await expect(accessorySearchMethod(mockClient, { page: 0, limit: 10 }))
        .rejects.toThrow('Page number must be 1 or greater.');
    });

    test('should validate limit parameter', async () => {
      await expect(accessorySearchMethod(mockClient, { page: 1, limit: 0 }))
        .rejects.toThrow('Limit must be 1 or greater.');
    });

    test('should validate expand parameter', async () => {
      await expect(accessorySearchMethod(mockClient, { page: 1, limit: 10, expand: 'invalid' }))
        .rejects.toThrow('Expand parameter must be one of: none, services, characteristics');
    });
  });

  describe('Default Parameters', () => {
    test('should use default values', async () => {
      // Mock accessory.list response
      mockClient.callMethod.mockResolvedValue({
        isSuccess: true,
        data: { accessories: [] }
      });

      const result = await accessorySearchMethod(mockClient, {});

      expect(result.isSuccess).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
      expect(result.data.expand).toBe('services');
    });
  });

  describe('Room Filtering', () => {
    test('should filter by roomId', async () => {
      // Mock accessory.list response
      mockClient.callMethod.mockResolvedValue({
        isSuccess: true,
        data: {
          accessories: [
            { id: 1, name: 'Light 1', roomId: 5, online: true },
            { id: 2, name: 'Light 2', roomId: 3, online: true },
            { id: 3, name: 'Light 3', roomId: 5, online: true }
          ]
        }
      });

      const result = await accessorySearchMethod(mockClient, { roomId: 5 });

      expect(result.isSuccess).toBe(true);
      expect(result.data.accessories).toHaveLength(2);
      expect(result.data.accessories.every(acc => acc.roomId === 5)).toBe(true);
      expect(result.data.appliedFilters.roomFilter).toBe('Room ID: 5');
    });

    test('should filter by roomName', async () => {
      // Mock room.list response
      mockClient.callMethod.mockImplementation((method) => {
        if (method === 'room.list') {
          return Promise.resolve({
            isSuccess: true,
            data: {
              rooms: [
                { id: 1, name: 'Living Room' },
                { id: 2, name: 'Kitchen' }
              ]
            }
          });
        } else if (method === 'accessory.list') {
          return Promise.resolve({
            isSuccess: true,
            data: {
              accessories: [
                { id: 1, name: 'Light', roomId: 1, online: true },
                { id: 2, name: 'Switch', roomId: 2, online: true }
              ]
            }
          });
        }
      });

      const result = await accessorySearchMethod(mockClient, { roomName: 'living' });

      expect(result.isSuccess).toBe(true);
      expect(result.data.accessories).toHaveLength(1);
      expect(result.data.accessories[0].roomId).toBe(1);
      expect(result.data.appliedFilters.roomFilter).toBe('living (ID: 1)');
    });

    test('should handle non-existent room', async () => {
      // Mock room.list response with no matching room
      mockClient.callMethod.mockResolvedValue({
        isSuccess: true,
        data: {
          rooms: [
            { id: 1, name: 'Living Room' },
            { id: 2, name: 'Kitchen' }
          ]
        }
      });

      const result = await accessorySearchMethod(mockClient, { roomName: 'basement' });

      expect(result.isSuccess).toBe(true);
      expect(result.data.accessories).toHaveLength(0);
      expect(result.data.total).toBe(0);
      expect(result.data.filtered).toBe(0);
      expect(result.data.appliedFilters.roomFilter).toBe('basement (not found)');
    });
  });

  describe('Text Search', () => {
    test('should filter by search text', async () => {
      mockClient.callMethod.mockResolvedValue({
        isSuccess: true,
        data: {
          accessories: [
            { id: 1, name: 'Living Room Light', online: true },
            { id: 2, name: 'Kitchen Switch', online: true },
            { id: 3, name: 'Bedroom Light', online: true }
          ]
        }
      });

      const result = await accessorySearchMethod(mockClient, { search: 'light' });

      expect(result.isSuccess).toBe(true);
      expect(result.data.accessories).toHaveLength(2);
      expect(result.data.accessories.every(acc => 
        acc.name.toLowerCase().includes('light')
      )).toBe(true);
      expect(result.data.appliedFilters.searchFilter).toBe('light');
    });
  });

  describe('Pagination', () => {
    test('should paginate results correctly', async () => {
      // Create 25 mock accessories
      const accessories = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Device ${i + 1}`,
        online: true
      }));

      mockClient.callMethod.mockResolvedValue({
        isSuccess: true,
        data: { accessories }
      });

      const result = await accessorySearchMethod(mockClient, { page: 2, limit: 10 });

      expect(result.isSuccess).toBe(true);
      expect(result.data.accessories).toHaveLength(10);
      expect(result.data.accessories[0].name).toBe('Device 11');
      expect(result.data.total).toBe(25);
      expect(result.data.filtered).toBe(25);
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    });

    test('should calculate pagination flags correctly', async () => {
      const accessories = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Device ${i + 1}`,
        online: true
      }));

      mockClient.callMethod.mockResolvedValue({
        isSuccess: true,
        data: { accessories }
      });

      const result = await accessorySearchMethod(mockClient, { page: 2, limit: 10 });

      expect(result.data.hasNextPage).toBe(true); // Page 3 exists
      expect(result.data.hasPreviousPage).toBe(true); // Page 1 exists  
      expect(result.data.totalPages).toBe(3); // Math.ceil(25/10) = 3
    });

    test('should handle first page correctly', async () => {
      const accessories = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Device ${i + 1}`,
        online: true
      }));

      mockClient.callMethod.mockResolvedValue({
        isSuccess: true,
        data: { accessories }
      });

      const result = await accessorySearchMethod(mockClient, { page: 1, limit: 10 });

      expect(result.data.hasNextPage).toBe(true);
      expect(result.data.hasPreviousPage).toBe(false);
      expect(result.data.totalPages).toBe(3);
    });

    test('should handle last page correctly', async () => {
      const accessories = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Device ${i + 1}`,
        online: true
      }));

      mockClient.callMethod.mockResolvedValue({
        isSuccess: true,
        data: { accessories }
      });

      const result = await accessorySearchMethod(mockClient, { page: 3, limit: 10 });

      expect(result.data.accessories).toHaveLength(5); // Only 5 on last page
      expect(result.data.hasNextPage).toBe(false);
      expect(result.data.hasPreviousPage).toBe(true);
      expect(result.data.totalPages).toBe(3);
    });
  });

  describe('Error Handling', () => {
    test('should propagate room.list errors', async () => {
      mockClient.callMethod.mockResolvedValue({
        isSuccess: false,
        code: -1,
        message: 'Room list error'
      });

      const result = await accessorySearchMethod(mockClient, { roomName: 'test' });

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Room list error');
    });

    test('should propagate accessory.list errors', async () => {
      mockClient.callMethod.mockResolvedValue({
        isSuccess: false,
        code: -1,
        message: 'Accessory list error'
      });

      const result = await accessorySearchMethod(mockClient, { search: 'test' });

      expect(result.isSuccess).toBe(false);
      expect(result.message).toBe('Accessory list error');
    });
  });
});