const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { run, pack, scratch, install } = require('./package-utils.cjs');
const temporary = scratch();
try {
  const source = path.resolve(__dirname, '../..');
  const { archive } = pack(source, temporary);
  const consumer = path.join(temporary, 'consumer'); fs.mkdirSync(consumer);
  install(consumer, [archive]);
  const entry = require.resolve('spruthub-client', { paths: [consumer] });
  const { Sprut, Schema } = require(entry);
  assert.strictEqual(typeof Sprut.prototype.watchLogs, 'function', 'Packed client lacks watchLogs');
  assert.strictEqual(typeof Schema.getAvailableMethods, 'function');
  run(process.execPath, [path.join(__dirname, 'runtime-smoke.cjs'), consumer], consumer);
  console.log('Clean installed client archive: exports + fake-WS recovery/shutdown PASS');
} finally { fs.rmSync(temporary, { recursive: true, force: true }); }
