#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bannedExactPaths = [
  '.cursor/mcp.json',
  '.cursor/settings.local.json',
  'package-lock.json',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
];

const bannedPathMatchers = [
  /^\.DS_Store$/,
  /^\.blop\//,
  /^\.tmp-test-fixtures\//,
  /^coverage\//,
  /^\.tmp-vitest-cache\//,
  /^dist\//,
];

const bannedFileMatchers = [/\.log$/i, /\.(tmp|temp|tgz)$/i];

/**
 * Allow checked-in env examples, but fail any real tracked env file.
 *
 * @param {string} file
 * @returns {boolean}
 */
export function isTrackedEnvironmentFile(file) {
  return /(^|\/)\.env($|\.)/.test(file) && !file.endsWith('.env.example');
}

/**
 * @param {string[]} trackedFiles
 * @returns {string[]}
 */
export function getRepositoryHygieneViolations(trackedFiles) {
  return trackedFiles.filter((file) => {
    return (
      bannedExactPaths.includes(file) ||
      bannedPathMatchers.some((matcher) => matcher.test(file)) ||
      bannedFileMatchers.some((matcher) => matcher.test(file)) ||
      isTrackedEnvironmentFile(file)
    );
  });
}

/**
 * @returns {void}
 */
export function main() {
  const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
  const violations = getRepositoryHygieneViolations(trackedFiles);

  if (violations.length > 0) {
    console.error(
      'Repository hygiene check failed. Remove tracked generated artifacts:',
    );
    for (const file of violations) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }

  console.log('Repository hygiene check passed.');
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  main();
}
