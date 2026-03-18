import path from 'path';
import type { EnvConfig, MCPServerConfig } from './utils/types.js';

export const SERVER_NAME = 'blop';
export const MIN_PYTHON_VERSION = '3.11.0';

export const DEFAULT_ENV_KEYS: Array<keyof EnvConfig> = [
  'GOOGLE_API_KEY',
  'APP_BASE_URL',
  'LOGIN_URL',
  'TEST_USERNAME',
  'TEST_PASSWORD',
];

export function buildDefaultEnv(overrides: Partial<EnvConfig>): EnvConfig {
  return {
    GOOGLE_API_KEY: overrides.GOOGLE_API_KEY ?? '',
    APP_BASE_URL: overrides.APP_BASE_URL,
    LOGIN_URL: overrides.LOGIN_URL,
    TEST_USERNAME: overrides.TEST_USERNAME,
    TEST_PASSWORD: overrides.TEST_PASSWORD,
    BLOP_DB_PATH: '.blop/runs.db',
    BLOP_HEADLESS: 'true',
    BLOP_MAX_STEPS: '50',
  };
}

export function buildCursorServerConfig(blopPath: string, env: EnvConfig): MCPServerConfig {
  return {
    command: 'uv',
    args: ['--directory', path.resolve(blopPath), 'run', 'python', '-m', 'blop.server'],
    env,
  };
}

