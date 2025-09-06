require('dotenv').config();
const { Sprut } = require("../src/index");

// Force Jest to exit after tests complete
jest.setTimeout(60000);

describe("Scenario Real Device Test", () => {
  let sprut;

  beforeAll(async () => {
    // Initialize Sprut with real device connection using .env variables
    sprut = new Sprut({
      wsUrl: process.env.WS_URL,
      sprutEmail: process.env.SPRUT_EMAIL,
      sprutPassword: process.env.SPRUT_PASSWORD,
      serial: process.env.SPRUT_SERIAL,
      logger: {
        info: console.log,
        debug: console.log,
        error: console.error,
      },
    });

    // Wait for connection and authentication
    await sprut.connected();
    
    // Ensure authentication is complete
    const authResult = await sprut.authManager.authenticate();
    if (authResult.isError) {
      throw new Error(`Authentication failed: ${authResult.error}`);
    }
    console.log('Authentication successful');
  }, 30000); // Increase timeout for real device connection

  afterAll(async () => {
    if (sprut) {
      try {
        // Clear any potential timeouts in the queue system
        if (sprut.queue && sprut.queue.clearAll) {
          sprut.queue.clearAll();
        }
        
        // Force close WebSocket connection
        if (sprut.wsManager && sprut.wsManager.forceCleanup) {
          sprut.wsManager.forceCleanup();
        }
        
        await sprut.close();
        
        // Give extra time for cleanup and force garbage collection
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clear references
        sprut = null;
      } catch (error) {
        console.log('Error during cleanup:', error.message);
      }
    }
  }, 15000); // Increase timeout for cleanup

  test("callMethod with parameter validation on real device", async () => {
    // Test callMethod with numeric index that will be coerced to string
    const result = await sprut.callMethod('scenario.get', {
      index: 100, // This number will be coerced to "100" string by validation
      expand: "data"
    });

    console.log('callMethod Result:', JSON.stringify(result, null, 2));

    // Verify the standardized response format
    expect(result).toHaveProperty('isSuccess');
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('data');

    if (result.isSuccess) {
      // Successful response - verify scenario data structure
      expect(result.data).toHaveProperty('index');
      expect(result.data.index).toBe('100'); // Should be coerced to string
      expect(typeof result.data.index).toBe('string');
      
      console.log('Parameter validation and coercion worked - numeric 100 became string "100"');
      
      // If expand="data" was provided and scenario exists, check the data field
      if (result.data.data !== undefined) {
        expect(typeof result.data.data).toBe('string');
        console.log('Scenario data expanded successfully');
      }
    } else {
      // Error response - verify error structure (expected if scenario 100 doesn't exist)
      expect(result.code).toBeDefined();
      expect(result.message).toBeDefined();
      console.log(`Expected error for non-existent scenario: ${result.message}`);
    }
  }, 15000);

  test("get scenario with expand data parameter", async () => {
    const result = await sprut.call({
      scenario: {
        get: {
          index: "100",
          expand: "data"
        }
      }
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    // Check if we got an error response
    if (result.error) {
      console.log('API Error:', result.error);
      
      // If scenario doesn't exist, that's expected - just verify the error structure
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
      return;
    }

    // Check for successful response
    expect(result).toHaveProperty('result');
    expect(result.result).toHaveProperty('scenario');
    expect(result.result.scenario).toHaveProperty('get');
    
    const scenarioData = result.result.scenario.get;
    expect(scenarioData).toHaveProperty('index');
    
    // If expand="data" was provided and scenario exists, check the data field
    if (scenarioData.data !== undefined) {
      expect(typeof scenarioData.data).toBe('string');
      
      // Try to parse the data field if it exists and is not empty
      if (scenarioData.data && scenarioData.data.trim() !== '') {
        try {
          const parsedData = JSON.parse(scenarioData.data);
          console.log('Parsed scenario data:', JSON.stringify(parsedData, null, 2));
          expect(parsedData).toBeDefined();
        } catch (e) {
          console.log('Data field is not JSON:', scenarioData.data);
          // Data field might contain non-JSON data, which is also valid
        }
      } else {
        console.log('Data field is empty or null');
      }
    }
  }, 15000); // Increase timeout for the test itself
});