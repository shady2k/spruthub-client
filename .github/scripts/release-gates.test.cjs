const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const script = path.join(__dirname, 'check-release-tag.cjs');

function check(refType, refName, version) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-tag-test-'));
  try {
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name: 'release-fixture', version }));
    return spawnSync(process.execPath, [script], { cwd: directory,
      env: { ...process.env, GITHUB_REF_TYPE: refType, GITHUB_REF_NAME: refName }, encoding: 'utf8' });
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('matching stable and prerelease tag/version are accepted without creating tags', () => {
  for (const version of ['9.8.7', '9.8.7-test.1']) {
    const result = check('tag', `v${version}`, version);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Release tag matches package version/);
  }
});
test('mismatched or unprefixed tag is rejected', () => {
  for (const ref of ['v9.8.6', '9.8.7']) {
    const result = check('tag', ref, '9.8.7');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /exactly match package.json version/);
  }
});
test('branch named like a release tag cannot pass', () => {
  const result = check('branch', 'v9.8.7', '9.8.7');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires a tag ref/);
});
