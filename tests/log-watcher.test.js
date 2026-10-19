const { WebSocketServer } = require('ws');
const Sprut = require('../src/core/client');
const waitFor = async predicate => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 5000) throw new Error('wait timeout');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};
const entry = { time: 1720000000123, level: 'INFO', path: 'scenario', message: 'same' };

describe('durable log collection with a real fake WebSocket server', () => {
  let server, client, sockets, requests, diagnostics, muted, dropSubscribeAck, rejectUnsubscribe, muteUnsubscribe, subscriptionSockets;
  beforeEach(async () => {
    sockets = []; requests = []; diagnostics = []; muted = false;
    dropSubscribeAck = false; rejectUnsubscribe = false; muteUnsubscribe = false; subscriptionSockets = [];
    server = new WebSocketServer({ port: 0, host: '127.0.0.1' });
    await new Promise(resolve => server.once('listening', resolve));
    server.on('connection', ws => {
      sockets.push(ws);
      const socketNumber = sockets.length;
      let answer = 0;
      ws.on('message', data => {
        const request = JSON.parse(data);
        requests.push(request.params);
        if (muted) return;
        const p = request.params;
        let result;
        if (p.account?.auth) result = { account: { auth: { status: 'ACCOUNT_RESPONSE_SUCCESS', question: { type: 'QUESTION_TYPE_EMAIL' } } } };
        if (p.account?.answer) {
          answer++;
          result = { account: { answer: answer === 1 ? { question: { type: 'QUESTION_TYPE_PASSWORD' } } : { status: 'ACCOUNT_RESPONSE_SUCCESS', token: 'TOP_SECRET_TOKEN' } } };
        }
        if (p.log?.subscribe) {
          subscriptionSockets.push(socketNumber);
          if (dropSubscribeAck) { dropSubscribeAck = false; return; }
        }
        if (p.log?.unsubscribe && muteUnsubscribe) return;
        if (p.log?.unsubscribe && rejectUnsubscribe) {
          ws.send(JSON.stringify({ id: request.id, error: { code: -1, message: 'mock unsubscribe rejection' } }));
          return;
        }
        if (p.log?.subscribe) result = { log: { subscribe: { uuid: `sub-${sockets.length}` } } };
        if (p.log?.list) result = { log: { list: { log: [entry, entry] } } };
        if (p.log?.unsubscribe) result = { log: { unsubscribe: {} } };
        ws.send(JSON.stringify({ id: request.id, result }));
        if (p.log?.subscribe) {
          ws.send('malformed TOP_SECRET_TOKEN');
          ws.send('null');
          ws.send(JSON.stringify({ event: { log: { log: {} } } }));
          ws.send(JSON.stringify({ event: { log: { log: [entry, entry] } } }));
        }
      });
    });
    const logger = Object.fromEntries(['info', 'warn', 'error', 'debug'].map(key => [key, (...args) => diagnostics.push(args)]));
    client = new Sprut({ wsUrl: `ws://127.0.0.1:${server.address().port}`, sprutEmail: 'SECRET_EMAIL', sprutPassword: 'SECRET_PASSWORD', serial: 'mock', logger, defaultTimeout: 300, reconnect: { baseMs: 20, maxMs: 40, heartbeatIntervalMs: 30, heartbeatTimeoutMs: 60 } });
  });
  afterEach(async () => {
    await client.close();
    for (const socket of sockets) socket.terminate();
    await new Promise(resolve => server.close(resolve));
  });
  test('auth, subscribe first, preserve identical overlap/ms, reconnect, quiet connection, shutdown and no auth payload logging', async () => {
    const records = [];
    const watcher = client.watchLogs(record => records.push(record), { count: 1000 });
    await watcher.ready;
    await waitFor(() => records.filter(r => r.type === 'hub_log').length === 4);
    expect(requests.findIndex(p => p.log?.subscribe)).toBeLessThan(requests.findIndex(p => p.log?.list));
    expect(records.filter(r => r.source === 'live')).toHaveLength(2);
    expect(records.filter(r => r.source === 'history')).toHaveLength(2);
    expect(records.filter(r => r.type === 'hub_log').every(r => r.time === entry.time)).toBe(true);
    expect(records.filter(r => r.source === 'history').every(r => r.replay && r.possibleDuplicate)).toBe(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(sockets).toHaveLength(1); // Silence is not a failed heartbeat.
    sockets[0].terminate();
    await waitFor(() => records.filter(r => r.state === 'subscribed').length === 2);
    await waitFor(() => records.filter(r => r.type === 'hub_log').length === 8);
    expect(requests.filter(p => p.account?.auth)).toHaveLength(2);
    expect(records.some(r => r.reason === 'disconnected')).toBe(true);
    const serialized = JSON.stringify(diagnostics);
    for (const secret of ['TOP_SECRET_TOKEN', 'SECRET_EMAIL', 'SECRET_PASSWORD']) expect(serialized).not.toContain(secret);
    expect(records.map(r => r.sequence)).toEqual(records.map((_, i) => i + 1));
    await watcher.stop();
    await watcher.done;
    expect(client.wsManager.isOpen()).toBeFalsy();
    const connections = sockets.length;
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(sockets).toHaveLength(connections);
  });
  test('lost subscribe ACK fences the socket before retrying', async () => {
    dropSubscribeAck = true;
    const records = [];
    const watcher = client.watchLogs(record => records.push(record), { count: 0 });
    await expect(watcher.ready).rejects.toThrow();
    await waitFor(() => records.some(r => r.state === 'subscribed'));
    expect(subscriptionSockets).toEqual([1, 2]);
    expect(sockets[0].readyState).toBe(3);
    expect(client.getActiveLogSubscriptions()).toHaveLength(1);
    await watcher.stop();
  });
  test('concurrent stop/close await the same completed shutdown even without unsubscribe ACK', async () => {
    muteUnsubscribe = true;
    const watcher = client.watchLogs(() => {}, { count: 0 });
    await watcher.ready;
    const first = watcher.stop();
    const second = watcher.stop();
    expect(first).toBe(second);
    let stopped = false;
    second.then(() => { stopped = true; });
    await waitFor(() => requests.some(p => p.log?.unsubscribe));
    expect(stopped).toBe(false);
    expect(client.close()).toBe(client.close());
    await Promise.all([first, second, watcher.done]);
    expect(client.wsManager.isOpen()).toBeFalsy();
    expect(client.getActiveLogSubscriptions()).toHaveLength(0);
    expect(client.authManager.isAuthenticated()).toBe(false);
    expect(client.queue.queue.size).toBe(0);
  });
  test('rejected unsubscribe still cleans callbacks, tokens, queue and transport timers', async () => {
    rejectUnsubscribe = true;
    const watcher = client.watchLogs(() => {}, { count: 0 });
    await watcher.ready;
    await watcher.stop();
    expect(client.getActiveLogSubscriptions()).toHaveLength(0);
    expect(client.logManager.logEventHandlers.size).toBe(0);
    expect(client.logManager.pendingHandlers.size).toBe(0);
    expect(client.authManager.isAuthenticated()).toBe(false);
    expect(client.queue.queue.size).toBe(0);
    expect(client.wsManager.heartbeat).toBeNull();
    expect(client.wsManager.pongDeadline).toBeNull();
    expect(client.wsManager.reconnectTimeout).toBeNull();
    expect(client.listenerCount('connected')).toBe(0);
    expect(client.listenerCount('disconnected')).toBe(0);
    expect(client.listenerCount('closed')).toBe(0);
    const requestCount = requests.length;
    await expect(client.getLogs()).rejects.toThrow('Client closed');
    expect(requests).toHaveLength(requestCount);
  });
  test('output failure while flushing stop cannot deadlock the shared stop promise', async () => {
    let failOutput;
    const blocked = new Promise((resolve, reject) => { failOutput = reject; });
    const watcher = client.watchLogs(() => blocked, { count: 0 });
    await watcher.ready;
    const rejection = expect(watcher.done).rejects.toThrow('mock output failed during stop');
    const stopping = watcher.stop();
    failOutput(new Error('mock output failed during stop'));
    await stopping;
    await rejection;
    expect(client.wsManager.isOpen()).toBeFalsy();
  });
  test('request timeout is retried and collection can recover without restarting', async () => {
    muted = true;
    const records = [];
    const watcher = client.watchLogs(record => records.push(record), { count: 0 });
    await expect(watcher.ready).rejects.toThrow();
    await waitFor(() => records.some(r => r.reason === 'recovery_failed'));
    muted = false;
    await waitFor(() => records.some(r => r.state === 'subscribed'));
    await watcher.stop();
  });
  test('missing pong is transport evidence and triggers recovery', async () => {
    await client.connected();
    // Reconfigure the mock server to deliberately violate WebSocket ping/pong.
    sockets[0]._autoPong = false;
    const records = [];
    const watcher = client.watchLogs(record => records.push(record), { count: 0 });
    await watcher.ready;
    await waitFor(() => records.some(r => r.reason === 'disconnected'));
    await waitFor(() => records.filter(r => r.state === 'subscribed').length === 2);
    await watcher.stop();
  });
  test('output failure closes transport and rejects done', async () => {
    await client.connected();
    const watcher = client.watchLogs(() => { throw new Error('mock output failure'); }, { count: 0 });
    await expect(watcher.done).rejects.toThrow('mock output failure');
    await waitFor(() => !client.wsManager.isOpen());
  });
  test('bounded queue preserves duplicates, reports overflow and waits for slow output', async () => {
    let release;
    const blocked = new Promise(resolve => { release = resolve; });
    const records = [];
    const watcher = client.watchLogs(async record => { await blocked; records.push(record); }, { count: 2, maxPending: 2 });
    await watcher.ready;
    release();
    await waitFor(() => records.some(r => r.reason === 'output_overflow'));
    await watcher.stop();
    expect(records.find(r => r.reason === 'output_overflow').dropped).toBeGreaterThan(0);
  });
});
