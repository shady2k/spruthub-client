class Queue {
  constructor() {
    this.queue = new Map();
    this.timeouts = new Map();
  }

  add(id, callback, timeout = 30000) {
    if (this.timeouts.has(id)) {
      clearTimeout(this.timeouts.get(id));
    }
    this.queue.set(id, callback);
    const timeoutId = setTimeout(() => this.remove(id), timeout);
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
}

module.exports = Queue;