const accessoryEnhancedMethods = {
  'accessory.search': {
    description: 'Search and filter accessories with smart filtering, optimized for MCP server usage and natural language queries. Supports room filtering, text search, and device property filtering.',
    category: 'accessory',
    method: 'accessory.search',
    rest: { method: 'GET', path: '/accessories/search' },
    params: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number starting from 1',
          default: 1
        },
        limit: {
          type: 'number',
          description: 'Number of items per page',
          default: 10
        },
        expand: {
          type: 'string',
          description: 'Expansion level: none, services, or characteristics',
          enum: ['none', 'services', 'characteristics'],
          default: 'services'
        },
        roomId: {
          type: 'number',
          description: 'Filter by specific room ID'
        },
        roomName: {
          type: 'string',
          description: 'Filter by room name (case-insensitive partial match)'
        },
        search: {
          type: 'string',
          description: 'Text search in accessory names (case-insensitive partial match)'
        },
        manufacturer: {
          type: 'string',
          description: 'Filter by device manufacturer (case-insensitive partial match)'
        },
        model: {
          type: 'string',
          description: 'Filter by device model (case-insensitive partial match)'
        },
        online: {
          type: 'boolean',
          description: 'Filter by online status (true=online only, false=offline only, omit=all)'
        },
        virtual: {
          type: 'boolean',
          description: 'Filter by virtual device status (true=virtual only, false=physical only, omit=all)'
        },
        serviceType: {
          type: 'string',
          description: 'Filter accessories with specific service type (e.g., "Lightbulb", "Switch")'
        },
        characteristicType: {
          type: 'string',
          description: 'Filter accessories with specific characteristic type'
        },
        writable: {
          type: 'boolean',
          description: 'Filter accessories with writable characteristics only'
        }
      },
      required: []
    },
    result: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean' },
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            accessories: {
              type: 'array',
              items: { $ref: '#/definitions/Accessory' }
            },
            total: { 
              type: 'number',
              description: 'Total number of accessories matching filters'
            },
            filtered: {
              type: 'number', 
              description: 'Number of accessories after filtering (before pagination)'
            },
            page: { type: 'number' },
            limit: { type: 'number' },
            hasNextPage: {
              type: 'boolean',
              description: 'True if there are more results available after the current page'
            },
            hasPreviousPage: {
              type: 'boolean', 
              description: 'True if there are previous pages available'
            },
            totalPages: {
              type: 'number',
              description: 'Total number of pages for the filtered results'
            },
            expand: { type: 'string' },
            appliedFilters: {
              type: 'object',
              description: 'Summary of filters that were applied',
              properties: {
                roomFilter: { type: 'string' },
                searchFilter: { type: 'string' },
                serviceTypeFilter: { type: 'string' },
                characteristicTypeFilter: { type: 'string' },
                onlineFilter: { type: 'boolean' },
                virtualFilter: { type: 'boolean' },
                writableFilter: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    enhanced: true
  }
};

module.exports = accessoryEnhancedMethods;