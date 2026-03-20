#!/usr/bin/env node
import { execSync } from 'node:child_process';

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean);

const bannedPathMatchers = [
  /^\.DS_Store$/,
  /^\.blop\//,
  /^\.tmp-test-fixtures\//,
  /^coverage\//,
  /^\.tmp-vitest-cache\//,
];

const bannedFileMatchers = [
  /\.log$/i,
  /\.(tmp|temp)$/i,
];

const violations = trackedFiles.filter((file) => {
  return (
    bannedPathMatchers.some((matcher) => matcher.test(file)) ||
    bannedFileMatchers.some((matcher) => matcher.test(file))
  );
});

if (violations.length > 0) {
  console.error('Repository hygiene check failed. Remove tracked generated artifacts:');
  for (const file of violations) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('Repository hygiene check passed.');
