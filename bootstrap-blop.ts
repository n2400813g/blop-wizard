import fs from 'fs';
import path from 'path';
import clack from './clack.js';
import { abortIfCancelled, promptEnvValues } from './clack-utils.js';
import { ensureBlopBootstrap } from './dependencies.js';
import { buildDefaultEnv } from './defaults.js';
import { readEnvFile, upsertEnvFile } from './config-write.js';
import type { BootstrapOptions, EnvConfig } from './types.js';

function hasRequiredProviderKey(env: Partial<EnvConfig>): boolean {
  const provider = (env.BLOP_LLM_PROVIDER ?? 'google').trim().toLowerCase();
  if (provider === 'anthropic') {
    return Boolean(env.ANTHROPIC_API_KEY);
  }
  if (provider === 'openai') {
    return Boolean(env.OPENAI_API_KEY);
  }
  return Boolean(env.GOOGLE_API_KEY);
}

function requiredProviderKeyName(env: Partial<EnvConfig>): string {
  const provider = (env.BLOP_LLM_PROVIDER ?? 'google').trim().toLowerCase();
  if (provider === 'anthropic') {
    return 'ANTHROPIC_API_KEY';
  }
  if (provider === 'openai') {
    return 'OPENAI_API_KEY';
  }
  return 'GOOGLE_API_KEY';
}

function ensureEnvFile(runtimePath: string, localSourcePath?: string): string {
  const envPath = path.join(runtimePath, '.env');
  if (fs.existsSync(envPath)) {
    return envPath;
  }

  const envExamplePath = localSourcePath
    ? path.join(localSourcePath, '.env.example')
    : undefined;
  if (envExamplePath && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    return envPath;
  }

  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, '', 'utf8');
  return envPath;
}

export async function bootstrapBlop(
  options: BootstrapOptions,
): Promise<{ envPath: string; env: EnvConfig }> {
  const { runtimePath, localSourcePath, ci = false } = options;

  if (!ci) {
    const shouldBootstrap = await abortIfCancelled(
      clack.confirm({
        message:
          'Run dependency bootstrap (uv venv, install blop, Playwright)?',
        initialValue: true,
      }),
    );
    if (shouldBootstrap) {
      await ensureBlopBootstrap(options);
    }
  } else {
    await ensureBlopBootstrap(options);
  }

  const envPath = ensureEnvFile(runtimePath, localSourcePath);
  const existing = readEnvFile(envPath);

  let answers: Partial<EnvConfig>;
  if (ci) {
    answers = {
      BLOP_LLM_PROVIDER:
        process.env.BLOP_LLM_PROVIDER ?? existing.BLOP_LLM_PROVIDER ?? 'google',
      BLOP_LLM_MODEL: process.env.BLOP_LLM_MODEL ?? existing.BLOP_LLM_MODEL,
      GOOGLE_API_KEY:
        process.env.GOOGLE_API_KEY ?? existing.GOOGLE_API_KEY ?? '',
      ANTHROPIC_API_KEY:
        process.env.ANTHROPIC_API_KEY ?? existing.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? existing.OPENAI_API_KEY,
      APP_BASE_URL: process.env.APP_BASE_URL ?? existing.APP_BASE_URL,
      LOGIN_URL: process.env.LOGIN_URL ?? existing.LOGIN_URL,
      TEST_USERNAME: process.env.TEST_USERNAME ?? existing.TEST_USERNAME,
      TEST_PASSWORD: process.env.TEST_PASSWORD ?? existing.TEST_PASSWORD,
    };
    if (!hasRequiredProviderKey(answers)) {
      throw new Error(
        `${requiredProviderKeyName(answers)} is required in CI mode.`,
      );
    }
  } else {
    answers = await promptEnvValues(existing);
  }

  const merged = buildDefaultEnv(
    {
      ...existing,
      ...answers,
    },
    runtimePath,
  );
  upsertEnvFile(envPath, merged);
  clack.log.success(`Updated ${path.relative(process.cwd(), envPath)}`);

  return { envPath, env: merged };
}
