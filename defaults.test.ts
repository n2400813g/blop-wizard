import { describe, expect, it } from 'vitest';
import { buildDefaultEnv } from './defaults.js';

describe('default env posture', () => {
  it('uses the canonical MVP release-confidence defaults', () => {
    const runtimePath = '/tmp/blop-runtime';
    const env = buildDefaultEnv(
      {
        GOOGLE_API_KEY: 'test-key',
        APP_BASE_URL: 'https://example.com',
      },
      runtimePath,
    );

    expect(env.BLOP_ENV).toBe('production');
    expect(env.BLOP_REQUIRE_ABSOLUTE_PATHS).toBe('true');
    expect(env.BLOP_DB_PATH).toBe('/tmp/blop-runtime/data/runs.db');
    expect(env.BLOP_RUNS_DIR).toBe('/tmp/blop-runtime/runs');
    expect(env.BLOP_DEBUG_LOG).toBe('/tmp/blop-runtime/logs/blop.log');
    expect(env.BLOP_CAPABILITIES_PROFILE).toBe('production_minimal');
    expect(env.BLOP_ENABLE_COMPAT_TOOLS).toBe('false');
    expect(env.BLOP_ALLOW_INTERNAL_URLS).toBe('false');
    expect(env.BLOP_RUN_TIMEOUT_SECS).toBe('1800');
    expect(env.BLOP_STEP_TIMEOUT_SECS).toBe('45');
    expect(env.BLOP_MAX_CONCURRENT_RUNS).toBe('10');
    expect(env.GOOGLE_API_KEY).toBe('test-key');
    expect(env.BLOP_LLM_PROVIDER).toBe('google');
    expect(env.APP_BASE_URL).toBe('https://example.com');
  });

  it('upgrades relative runtime paths to production-safe absolute paths', () => {
    const env = buildDefaultEnv(
      {
        GOOGLE_API_KEY: 'test-key',
        BLOP_DB_PATH: '.blop/runs.db',
        BLOP_RUNS_DIR: 'runs',
        BLOP_DEBUG_LOG: 'logs/blop.log',
      },
      '/tmp/blop-runtime',
    );

    expect(env.BLOP_DB_PATH).toBe('/tmp/blop-runtime/data/runs.db');
    expect(env.BLOP_RUNS_DIR).toBe('/tmp/blop-runtime/runs');
    expect(env.BLOP_DEBUG_LOG).toBe('/tmp/blop-runtime/logs/blop.log');
  });
});
