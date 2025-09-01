/**
 * Scenario-related type definitions for SprutHub API
 */

const scenarioTypes = {
  // Scenario definition
  Scenario: {
    type: 'object',
    properties: {
      index: { type: ['number', 'string'] },
      name: { type: 'string' },
      desc: { type: 'string' },
      type: { 
        type: 'string',
        enum: ['BLOCK', 'LOGIC', 'GLOBAL'],
        default: 'BLOCK'
      },
      active: { type: 'boolean' },
      onStart: { type: 'boolean' },
      sync: { type: 'boolean' },
      data: { type: 'string' }, // JSON string containing scenario logic
      lastRun: { type: 'number' },
      runCount: { type: 'number' },
      order: { type: 'number' },
      predefined: { type: 'boolean' },
      error: { type: 'boolean' },
      rooms: { 
        type: 'array',
        items: { type: 'number' },
        description: 'Array of room IDs associated with scenario'
      },
      iconsIf: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of condition icon types'
      },
      iconsThen: {
        type: 'array', 
        items: { type: 'string' },
        description: 'Array of action icon types'
      }
    },
    required: ['index', 'name', 'type']
  },

  // Scenario create request
  ScenarioCreateRequest: {
    type: 'object',
    properties: {
      name: { 
        type: 'string',
        minLength: 1,
        maxLength: 255
      },
      desc: { 
        type: 'string',
        default: ''
      },
      type: { 
        type: 'string',
        enum: ['BLOCK', 'LOGIC', 'GLOBAL'],
        default: 'BLOCK'
      },
      active: { 
        type: 'boolean',
        default: true
      },
      onStart: { 
        type: 'boolean',
        default: true
      },
      sync: { 
        type: 'boolean',
        default: false
      },
      data: { 
        oneOf: [
          { type: 'string' },
          { type: 'object' }
        ]
      }
    },
    required: ['name']
  },

  // Scenario update request
  ScenarioUpdateRequest: {
    type: 'object',
    properties: {
      index: { type: 'number' },
      data: { 
        oneOf: [
          { type: 'string' },
          { type: 'object' }
        ]
      }
    },
    required: ['index', 'data']
  }
};

module.exports = scenarioTypes;