import { describe, expect, it } from 'vitest';
import {
  getRepositoryHygieneViolations,
  isTrackedEnvironmentFile,
} from './check-repo-hygiene.mjs';

describe('repository hygiene policy', () => {
  it('allows intentional source and project files', () => {
    const files = [
      'README.md',
      'package.json',
      'pnpm-lock.yaml',
      '.env.example',
      '.github/workflows/package-verify.yml',
    ];

    expect(getRepositoryHygieneViolations(files)).toEqual([]);
  });

  it('blocks tracked generated artifacts, secrets, and local config', () => {
    const files = [
      'dist/index.js',
      'coverage/lcov.info',
      '.cursor/mcp.json',
      '.env',
      '.env.local',
      'package-lock.json',
      'debug.tgz',
      'runtime.log',
    ];

    expect(getRepositoryHygieneViolations(files)).toEqual(files);
  });

  it('treats env examples as safe but real env files as violations', () => {
    expect(isTrackedEnvironmentFile('.env.example')).toBe(false);
    expect(isTrackedEnvironmentFile('.env')).toBe(true);
    expect(isTrackedEnvironmentFile('.env.production')).toBe(true);
  });
});
