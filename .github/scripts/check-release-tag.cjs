const fs = require('fs');
const { assertReleaseTag } = require('./release-policy.cjs');
try {
  const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assertReleaseTag(process.env.GITHUB_REF_TYPE, process.env.GITHUB_REF_NAME, version);
  console.log('Release tag matches package version');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
