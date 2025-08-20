const { Queue } = require("../src/index");

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
    queue.add("test-id", callback); // Uses default 30000ms timeout
    
    expect(queue.timeouts.has("test-id")).toBe(true);
  });
});