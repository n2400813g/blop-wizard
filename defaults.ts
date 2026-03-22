import path from 'path';
import type { EnvConfig, MCPServerConfig } from './types.js';
import { getVenvBlopMcpPath } from './dependencies.js';

export const SERVER_NAME = 'blop';
export const MIN_PYTHON_VERSION = '3.11.0';
export const DEFAULT_INSTALL_SOURCE = 'pypi';
export const DEFAULT_BLOP_PACKAGE_NAME = 'blop-mcp';

export const DEFAULT_ENV_KEYS: Array<keyof EnvConfig> = [
  'GOOGLE_API_KEY',
  'BLOP_LLM_PROVIDER',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'APP_BASE_URL',
  'LOGIN_URL',
  'TEST_USERNAME',
  'TEST_PASSWORD',
];

function absoluteOrFallback(candidate: string | undefined, fallback: string): string {
  if (candidate && path.isAbsolute(candidate)) {
    return candidate;
  }
  return fallback;
}

export function buildDefaultEnv(overrides: Partial<EnvConfig>, runtimePath = process.cwd()): EnvConfig {
  const resolvedRuntimePath = path.resolve(runtimePath);
  return {
    GOOGLE_API_KEY: overrides.GOOGLE_API_KEY ?? '',
    BLOP_LLM_PROVIDER: (overrides.BLOP_LLM_PROVIDER ?? 'google').trim().toLowerCase(),
    BLOP_LLM_MODEL: overrides.BLOP_LLM_MODEL,
    ANTHROPIC_API_KEY: overrides.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: overrides.OPENAI_API_KEY,
    APP_BASE_URL: overrides.APP_BASE_URL,
    LOGIN_URL: overrides.LOGIN_URL,
    TEST_USERNAME: overrides.TEST_USERNAME,
    TEST_PASSWORD: overrides.TEST_PASSWORD,
    BLOP_ENV: overrides.BLOP_ENV ?? 'production',
    BLOP_REQUIRE_ABSOLUTE_PATHS: overrides.BLOP_REQUIRE_ABSOLUTE_PATHS ?? 'true',
    BLOP_DB_PATH: absoluteOrFallback(
      overrides.BLOP_DB_PATH,
      path.join(resolvedRuntimePath, 'data', 'runs.db'),
    ),
    BLOP_RUNS_DIR: absoluteOrFallback(
      overrides.BLOP_RUNS_DIR,
      path.join(resolvedRuntimePath, 'runs'),
    ),
    BLOP_DEBUG_LOG: absoluteOrFallback(
      overrides.BLOP_DEBUG_LOG,
      path.join(resolvedRuntimePath, 'logs', 'blop.log'),
    ),
    BLOP_CAPABILITIES_PROFILE: overrides.BLOP_CAPABILITIES_PROFILE ?? 'production_minimal',
    BLOP_ENABLE_COMPAT_TOOLS: overrides.BLOP_ENABLE_COMPAT_TOOLS ?? 'false',
    BLOP_ALLOW_INTERNAL_URLS: overrides.BLOP_ALLOW_INTERNAL_URLS ?? 'false',
    BLOP_HEADLESS: overrides.BLOP_HEADLESS ?? 'true',
    BLOP_MAX_STEPS: overrides.BLOP_MAX_STEPS ?? '50',
    BLOP_RUN_TIMEOUT_SECS: overrides.BLOP_RUN_TIMEOUT_SECS ?? '1800',
    BLOP_STEP_TIMEOUT_SECS: overrides.BLOP_STEP_TIMEOUT_SECS ?? '45',
    BLOP_MAX_CONCURRENT_RUNS: overrides.BLOP_MAX_CONCURRENT_RUNS ?? '10',
    BLOP_ALLOW_SCREENSHOT_LLM: overrides.BLOP_ALLOW_SCREENSHOT_LLM ?? 'false',
  };
}

export function buildCursorServerConfig(runtimePath: string, env: EnvConfig): MCPServerConfig {
  return {
    command: getVenvBlopMcpPath(runtimePath),
    env,
  };
}
