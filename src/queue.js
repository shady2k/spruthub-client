class Queue {
  constructor() {
    this.queue = new Map();
    this.timeouts = new Map();
  }

  add(id, callback, timeout = 5000) {
    if (this.timeouts.has(id)) {
      clearTimeout(this.timeouts.get(id));
    }
    this.queue.set(id, callback);
    const timeoutId = setTimeout(() => {
      const queuedCallback = this.queue.get(id);
      if (queuedCallback) {
        queuedCallback({
          error: {
            code: -32603,
            message: `Request timeout after ${timeout}ms. This may indicate a malformed request that was silently rejected by the server.`,
            data: { timeout, requestId: id }
          }
        });
      }
      this.remove(id);
    }, timeout);
    this.timeouts.set(id, timeoutId);
  }

  get(id) {
    return this.queue.get(id);
  }

  remove(id) {
    if (this.timeouts.has(id)) {
      // Clear the timeout to prevent the callback from being invoked
      clearTimeout(this.timeouts.get(id));
      this.timeouts.delete(id);
    }
    this.queue.delete(id);
  }

  clearAll() {
    // Clear all timeouts to prevent any pending callbacks
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
    this.queue.clear();
  }
}

module.exports = Queue;