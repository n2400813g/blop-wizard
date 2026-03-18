import chalk from 'chalk';
import clack, { isCancel } from './clack.js';
import type { EnvConfig } from './types.js';

export async function abortIfCancelled<T>(input: Promise<T> | T): Promise<Exclude<T, symbol>> {
  const value = await input;
  if (isCancel(value)) {
    clack.cancel('Setup cancelled.');
    process.exit(0);
  }
  return value as Exclude<T, symbol>;
}

export function printWelcome(): void {
  console.log('');
  clack.intro(chalk.bgGreen.black(' Blop MCP Wizard '));
  clack.note(
    'Installs and configures blop-use MCP for Cursor and Claude Code.\nThe wizard can bootstrap Python deps, generate .env, and wire client configs.',
    'What this does',
  );
}

export function printRestartHint(): void {
  clack.log.message(chalk.dim('Restart Cursor/Claude Code after config updates.'));
}

export async function promptEnvValues(existing: Partial<EnvConfig> = {}): Promise<Partial<EnvConfig>> {
  const googleApiKey = await abortIfCancelled(
    clack.text({
      message: 'Google API key (required):',
      placeholder: 'AIza...',
      initialValue: existing.GOOGLE_API_KEY ?? '',
      validate: (value) => (!value ? 'GOOGLE_API_KEY is required' : undefined),
    }),
  );

  const appBaseUrl = await abortIfCancelled(
    clack.text({
      message: 'APP_BASE_URL (optional):',
      placeholder: 'https://your-app.com',
      initialValue: existing.APP_BASE_URL ?? '',
    }),
  );

  const loginUrl = await abortIfCancelled(
    clack.text({
      message: 'LOGIN_URL (optional):',
      placeholder: 'https://your-app.com/login',
      initialValue: existing.LOGIN_URL ?? '',
    }),
  );

  const testUsername = await abortIfCancelled(
    clack.text({
      message: 'TEST_USERNAME (optional):',
      placeholder: 'tester@example.com',
      initialValue: existing.TEST_USERNAME ?? '',
    }),
  );

  const testPassword = await abortIfCancelled(
    clack.password({
      message: 'TEST_PASSWORD (optional):',
      validate: () => undefined,
    }),
  );

  return {
    GOOGLE_API_KEY: googleApiKey.trim(),
    APP_BASE_URL: appBaseUrl.trim() || undefined,
    LOGIN_URL: loginUrl.trim() || undefined,
    TEST_USERNAME: testUsername.trim() || undefined,
    TEST_PASSWORD: testPassword.trim() || undefined,
  };
}

