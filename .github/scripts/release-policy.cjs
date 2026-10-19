const assert = require('assert');

function assertReleaseTag(refType, refName, version) {
  assert.strictEqual(refType, 'tag', 'Release requires a tag ref');
  assert(typeof version === 'string' && version.length > 0, 'Package version is missing');
  assert.strictEqual(refName, `v${version}`, 'Release tag must exactly match package.json version');
}

module.exports = { assertReleaseTag };
