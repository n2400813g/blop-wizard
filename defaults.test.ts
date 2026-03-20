import { describe, expect, it } from 'vitest';
import { buildDefaultEnv } from './defaults.js';

describe('default env posture', () => {
  it('uses the canonical MVP release-confidence defaults', () => {
    const env = buildDefaultEnv({
      GOOGLE_API_KEY: 'test-key',
      APP_BASE_URL: 'https://example.com',
    });

    expect(env.BLOP_CAPABILITIES_PROFILE).toBe('production_minimal');
    expect(env.BLOP_ENABLE_COMPAT_TOOLS).toBe('false');
    expect(env.GOOGLE_API_KEY).toBe('test-key');
    expect(env.APP_BASE_URL).toBe('https://example.com');
  });
});
