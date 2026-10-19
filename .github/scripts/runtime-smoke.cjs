const path = require('path');
const assert = require('assert');
const consumer = path.resolve(process.argv[2]);
const entry = require.resolve('spruthub-client', { paths: [consumer] });
const { Sprut } = require(entry);
const { WebSocketServer } = require(require.resolve('ws', { paths: [path.dirname(entry)] }));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const until = async predicate => {
  const deadline = Date.now() + 10000;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('Mock stream timeout'); await delay(10); }
};
(async () => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise(resolve => server.once('listening', resolve));
  const sockets = []; const records = []; let client; let watcher;
  const hubLog = { time: 1720000000123, level: 'INFO', path: 'mock', message: 'identical event' };
  server.on('connection', socket => {
    sockets.push(socket); let answers = 0;
    socket.on('message', bytes => {
      const request = JSON.parse(bytes); const p = request.params; let result;
      if (p.account && p.account.auth) result = { account: { auth: { status: 'ACCOUNT_RESPONSE_SUCCESS', question: { type: 'QUESTION_TYPE_EMAIL' } } } };
      if (p.account && p.account.answer) result = { account: { answer: ++answers === 1 ? { question: { type: 'QUESTION_TYPE_PASSWORD' } } : { status: 'ACCOUNT_RESPONSE_SUCCESS', token: 'MOCK_TOKEN' } } };
      if (p.log && p.log.subscribe) result = { log: { subscribe: { uuid: `mock-${sockets.length}` } } };
      if (p.log && p.log.list) result = { log: { list: { log: [hubLog, hubLog] } } };
      if (p.log && p.log.unsubscribe) result = { log: { unsubscribe: {} } };
      socket.send(JSON.stringify({ id: request.id, result }));
      if (p.log && p.log.subscribe) socket.send(JSON.stringify({ event: { log: { log: [hubLog, hubLog] } } }));
    });
  });
  try {
    const logger = Object.fromEntries(['info', 'warn', 'error', 'debug'].map(k => [k, () => {}]));
    client = new Sprut({ wsUrl: `ws://127.0.0.1:${server.address().port}`, sprutEmail: 'mock', sprutPassword: 'mock', serial: 'mock', logger, reconnect: { baseMs: 20, maxMs: 40 } });
    watcher = client.watchLogs(record => records.push(record), { count: 2 });
    await watcher.ready; await until(() => records.filter(r => r.type === 'hub_log').length === 4);
    sockets[0].terminate(); await until(() => records.filter(r => r.type === 'hub_log').length === 8);
    assert(records.filter(r => r.type === 'hub_log').every(r => r.time === hubLog.time));
    assert(records.some(r => r.reason === 'disconnected'));
    assert(records.filter(r => r.source === 'history').every(r => r.replay && r.possibleDuplicate));
    await watcher.stop(); await watcher.done;
    assert(!client.wsManager.isOpen()); assert.strictEqual(client.getActiveLogSubscriptions().length, 0);
    assert(!JSON.stringify(records).includes('MOCK_TOKEN'));
  } finally {
    if (watcher) await watcher.stop(); else if (client) await client.close();
    for (const socket of sockets) socket.terminate();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
