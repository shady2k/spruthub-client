const accessoryEnhancedMethods = {
  'accessory.listPaged': {
    description: 'Get paginated accessory list',
    category: 'accessory',
    method: 'accessory.listPaged',
    rest: { method: 'GET', path: '/accessories/paged' },
    params: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number starting from 1'
        },
        limit: {
          type: 'number',
          description: 'Number of items per page'
        }
      },
      required: ['page', 'limit']
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
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' }
          }
        }
      }
    },
    enhanced: true
  }
};

module.exports = accessoryEnhancedMethods;