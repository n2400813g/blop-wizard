import fs from 'fs';
import path from 'path';
import clack from '../../utils/clack.js';
import { abortIfCancelled, promptEnvValues } from '../../utils/clack-utils.js';
import { ensureBlopBootstrap } from '../../utils/dependencies.js';
import { buildDefaultEnv } from '../../defaults.js';
import { readEnvFile, upsertEnvFile } from '../../utils/config-write.js';
import type { BootstrapOptions, EnvConfig } from '../../utils/types.js';

function copyEnvExample(blopPath: string): string {
  const envPath = path.join(blopPath, '.env');
  if (fs.existsSync(envPath)) {
    return envPath;
  }
  const envExamplePath = path.join(blopPath, '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    throw new Error(`Missing .env.example in ${blopPath}`);
  }
  fs.copyFileSync(envExamplePath, envPath);
  return envPath;
}

export async function bootstrapBlop(
  options: BootstrapOptions,
): Promise<{ envPath: string; env: EnvConfig }> {
  const { blopPath, ci = false } = options;

  if (!ci) {
    const shouldBootstrap = await abortIfCancelled(
      clack.confirm({
        message: 'Run dependency bootstrap (uv venv, editable install, Playwright)?',
        initialValue: true,
      }),
    );
    if (shouldBootstrap) {
      await ensureBlopBootstrap(options);
    }
  } else {
    await ensureBlopBootstrap(options);
  }

  const envPath = copyEnvExample(blopPath);
  const existing = readEnvFile(envPath);

  let answers: Partial<EnvConfig>;
  if (ci) {
    answers = {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? existing.GOOGLE_API_KEY ?? '',
      APP_BASE_URL: process.env.APP_BASE_URL ?? existing.APP_BASE_URL,
      LOGIN_URL: process.env.LOGIN_URL ?? existing.LOGIN_URL,
      TEST_USERNAME: process.env.TEST_USERNAME ?? existing.TEST_USERNAME,
      TEST_PASSWORD: process.env.TEST_PASSWORD ?? existing.TEST_PASSWORD,
    };
    if (!answers.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is required in CI mode.');
    }
  } else {
    answers = await promptEnvValues(existing);
  }

  const merged = buildDefaultEnv({
    ...existing,
    ...answers,
  });
  upsertEnvFile(envPath, merged);
  clack.log.success(`Updated ${path.relative(process.cwd(), envPath)}`);

  return { envPath, env: merged };
}

