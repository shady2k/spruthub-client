const Queue = require("../src/queue");

describe("Queue", () => {
  let queue;

  beforeEach(() => {
    queue = new Queue();
  });

  afterEach(() => {
    // Clear any remaining timeouts
    for (const [id] of queue.timeouts) {
      queue.remove(id);
    }
  });

  test("adds and retrieves callbacks", () => {
    const callback = jest.fn();
    queue.add("test-id", callback);
    
    const retrieved = queue.get("test-id");
    expect(retrieved).toBe(callback);
  });

  test("removes callbacks", () => {
    const callback = jest.fn();
    queue.add("test-id", callback);
    
    queue.remove("test-id");
    const retrieved = queue.get("test-id");
    expect(retrieved).toBeUndefined();
  });

  test("handles timeout for callbacks", (done) => {
    const callback = jest.fn();
    queue.add("test-id", callback, 100); // 100ms timeout
    
    setTimeout(() => {
      const retrieved = queue.get("test-id");
      expect(retrieved).toBeUndefined();
      done();
    }, 150);
  });

  test("invokes callback with timeout error when timeout occurs", (done) => {
    const callback = jest.fn();
    const timeout = 100;
    const requestId = "timeout-test";
    
    queue.add(requestId, callback, timeout);
    
    setTimeout(() => {
      // Verify callback was called with timeout error
      expect(callback).toHaveBeenCalledWith({
        error: {
          code: -32603,
          message: expect.stringContaining(`Request timeout after ${timeout}ms`),
          data: { timeout, requestId }
        }
      });
      
      // Verify the error message mentions malformed requests
      const [callArgs] = callback.mock.calls[0];
      expect(callArgs.error.message).toContain('malformed request');
      expect(callArgs.error.message).toContain('silently rejected');
      
      done();
    }, 150);
  });

  test("clears existing timeout when adding same id", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    queue.add("test-id", callback1, 1000);
    queue.add("test-id", callback2, 1000); // Should clear previous timeout
    
    const retrieved = queue.get("test-id");
    expect(retrieved).toBe(callback2);
  });

  test("handles multiple callbacks", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    queue.add("id-1", callback1);
    queue.add("id-2", callback2);
    
    expect(queue.get("id-1")).toBe(callback1);
    expect(queue.get("id-2")).toBe(callback2);
  });

  test("handles non-existent id removal", () => {
    // Should not throw error
    expect(() => queue.remove("non-existent")).not.toThrow();
  });

  test("uses default timeout when not specified", () => {
    const callback = jest.fn();
    queue.add("test-id", callback); // Uses default 5000ms timeout (updated from 30000)
    
    expect(queue.timeouts.has("test-id")).toBe(true);
  });
});