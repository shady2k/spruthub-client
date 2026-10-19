const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const assert = require('assert');

function run(command, args, cwd) {
  return cp.execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
}
function pack(source, destination) {
  const report = JSON.parse(run('npm', ['pack', source, '--ignore-scripts', '--json'], destination))[0];
  const allowed = report.name === 'spruthub-client' ? ['src/'] : ['dist/', 'bin/'];
  const archive = path.join(destination, report.filename);
  const names = run('tar', ['-tzf', archive], source).trim().split('\n');
  for (const name of names) {
    assert(name.startsWith('package/') && !name.split('/').includes('..'), 'Unsafe archive member');
  }
  for (const file of report.files) {
    const name = file.path;
    assert(['package.json', 'README.md', 'LICENSE'].includes(name) || allowed.some(prefix => name.startsWith(prefix)), `Unexpected package member: ${name}`);
    assert(!/(^|\/)(\.env[^/]*|\.git|\.aws|\.codex|\.claude|\.serena|artifacts|coverage|tests)(\/|$)|\.tgz$|credentials\.json$/i.test(name), `Private/runtime artifact: ${name}`);
    const contents = run('tar', ['-xOzf', archive, `package/${name}`], source);
    assert(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|192\.168\.\d+\.\d+|inside\.shady2k\.ru|\/Users\/shady\//.test(contents), `Sensitive/private content pattern: ${name}`);
  }
  console.log(`Audited ${report.name}@${report.version}: ${report.files.length} files, ${report.integrity}`);
  return { archive, report };
}
function scratch() { return fs.mkdtempSync(path.join(os.tmpdir(), 'spruthub-package-ci-')); }
function install(directory, archives) {
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name: 'clean-package-smoke', version: '1.0.0', private: true }));
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...archives], directory);
}
module.exports = { run, pack, scratch, install };
