const { randomBytes } = require('crypto');

// No event IDs/cursor exist in the hub API. Never deduplicate by content:
// two identical messages may be two real events.
class LogWatcher {
  constructor(client, output, options = {}) {
    this.client = client;
    this.client.wsManager.keepAlive = true;
    this.output = output;
    this.count = options.count ?? 1000;
    this.limit = options.maxPending ?? 4096;
    if (!Number.isInteger(this.limit) || this.limit < 1) throw new Error('maxPending must be a positive integer');
    if (!Number.isInteger(this.count) || this.count < 0 || this.count > 1000) throw new Error('count must be 0..1000');
    this.session = randomBytes(16).toString('hex');
    this.sequence = 0;
    this.pending = [];
    this.dropped = 0;
    this.stopped = false;
    this.generation = 0;
    this.attempt = 0;
    this.done = new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
    // Consumers may await ready before done. Mark rejection handled in that interval.
    this.done.catch(() => {});
    this.onDisconnect = () => {
      this.generation++;
      this.uuid = null;
      this.emit({ type: 'gap', reason: 'disconnected', replayComplete: false });
    };
    this.onConnect = () => { this.recover().catch(() => this.retry()); };
    this.onClose = () => { this.stop().catch(() => {}); };
    client.on('disconnected', this.onDisconnect);
    client.on('connected', this.onConnect);
    client.on('closed', this.onClose);
    this.emit({ type: 'lifecycle', state: 'starting' });
    this.ready = this.recover();
    this.ready.catch(() => this.retry());
  }

  emit(record) {
    if (this.stopped) return;
    const entry = { ...record, receivedAt: new Date().toISOString(), session: this.session, sequence: ++this.sequence };
    if (this.pending.length >= this.limit) { this.dropped++; return; }
    this.pending.push(entry);
    this.drain();
  }

  async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.pending.length || this.dropped) {
        if (this.dropped && this.pending.length < this.limit) {
          const dropped = this.dropped;
          this.dropped = 0;
          this.pending.push({ type: 'gap', reason: 'output_overflow', dropped,
            receivedAt: new Date().toISOString(), session: this.session, sequence: ++this.sequence });
        }
        await this.output(this.pending.shift());
      }
    } catch (error) {
      this.reject(error);
      this.stop(false).catch(error => this.reject(error));
    } finally {
      this.draining = false;
      if (this.flushResolve) this.flushResolve();
    }
  }

  retry() {
    if (this.stopped || this.timer) return;
    this.emit({ type: 'gap', reason: 'recovery_failed', replayComplete: false });
    this.timer = setTimeout(() => {
      this.timer = null;
      this.recover().catch(() => this.retry());
    }, Math.min(30000, 1000 * 2 ** Math.min(this.attempt++, 5)) * (0.5 + Math.random() * 0.5));
  }

  async recover() {
    if (this.stopped || this.recovering) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.recovering = true;
    const generation = this.generation;
    try {
      await this.client.connected();
      if (this.stopped || generation !== this.generation) return;
      if (!this.uuid) {
        let result;
        try {
          result = await this.client.subscribeLogs(entry => this.emit({ type: 'hub_log', source: 'live',
            time: entry.timestamp, level: entry.level, path: entry.component, message: entry.message }));
          if (this.stopped || generation !== this.generation) return;
          if (!result.isSuccess || !result.data?.uuid) throw new Error('Log subscription failed');
        } catch (error) {
          // Without an ACK we cannot know whether the hub created a subscription.
          // Close this transport before retrying to avoid orphan subscriptions.
          if (!this.stopped && generation === this.generation) this.client.wsManager.resetConnection();
          throw error;
        }
        this.uuid = result.data.uuid;
        this.emit({ type: 'lifecycle', state: 'subscribed' });
      }
      // Subscribe first. Keep all overlap and explicitly label replay/duplicates.
      if (this.count) {
        const result = await this.client.getLogs(this.count);
        if (this.stopped || generation !== this.generation) return;
        if (!result.isSuccess || !Array.isArray(result.data)) throw new Error('Log history failed');
        this.emit({ type: 'gap', reason: 'bounded_history', count: result.data.length,
          requested: this.count, replayComplete: false, possibleDuplicates: true });
        for (const entry of [...result.data].reverse()) {
          if (!entry || typeof entry !== 'object') continue;
          this.emit({ type: 'hub_log', source: 'history', replay: true, possibleDuplicate: true,
            time: entry.time, level: entry.level, path: entry.path, message: entry.message });
        }
      }
      this.attempt = 0;
    } finally {
      this.recovering = false;
      if (!this.stopped && generation !== this.generation) this.retry();
    }
  }

  stop(flush = true) {
    if (this.stopPromise) return this.stopPromise;
    this.emit({ type: 'lifecycle', state: 'stopping' });
    this.stopped = true;
    clearTimeout(this.timer);
    this.client.off('connected', this.onConnect);
    this.client.off('disconnected', this.onDisconnect);
    this.client.off('closed', this.onClose);
    this.stopPromise = Promise.resolve().then(async () => {
      await this.client.close();
      if (flush && this.draining) await new Promise(resolve => { this.flushResolve = resolve; });
      this.resolve();
    });
    return this.stopPromise;
  }

}
module.exports = LogWatcher;
