import chalk from 'chalk';
import clack, { isCancel } from './clack.js';
import type { EnvConfig } from './types.js';

export async function abortIfCancelled<T>(
  input: Promise<T> | T,
): Promise<Exclude<T, symbol>> {
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
    'Installs and configures blop as an MCP-native release confidence tool.\nThe wizard bootstraps Python deps, writes a canonical MVP .env, and wires coding clients to the 4-tool release workflow.',
    'What this does',
  );
}

export function printRestartHint(): void {
  clack.log.message(
    chalk.dim('Restart Cursor/Claude Code after config updates.'),
  );
}

function resolveLlmProvider(existing: Partial<EnvConfig>): string {
  const provider = (existing.BLOP_LLM_PROVIDER ?? 'google')
    .trim()
    .toLowerCase();
  if (provider === 'anthropic' || provider === 'openai') {
    return provider;
  }
  return 'google';
}

export async function promptEnvValues(
  existing: Partial<EnvConfig> = {},
): Promise<Partial<EnvConfig>> {
  const llmProvider = await abortIfCancelled(
    clack.select({
      message: 'LLM provider for blop:',
      options: [
        { value: 'google', label: 'Google' },
        { value: 'anthropic', label: 'Anthropic' },
        { value: 'openai', label: 'OpenAI' },
      ],
      initialValue: resolveLlmProvider(existing),
    }),
  );

  const googleApiKey = await abortIfCancelled(
    clack.text({
      message: 'GOOGLE_API_KEY:',
      placeholder: 'AIza...',
      initialValue: existing.GOOGLE_API_KEY ?? '',
      validate: (value) =>
        llmProvider === 'google' && !value
          ? 'GOOGLE_API_KEY is required'
          : undefined,
    }),
  );

  const anthropicApiKey = await abortIfCancelled(
    clack.password({
      message: 'ANTHROPIC_API_KEY:',
      validate: (value) =>
        llmProvider === 'anthropic' && !value
          ? 'ANTHROPIC_API_KEY is required'
          : undefined,
    }),
  );

  const openAiApiKey = await abortIfCancelled(
    clack.password({
      message: 'OPENAI_API_KEY:',
      validate: (value) =>
        llmProvider === 'openai' && !value
          ? 'OPENAI_API_KEY is required'
          : undefined,
    }),
  );

  const appBaseUrl = await abortIfCancelled(
    clack.text({
      message: 'APP_BASE_URL for release checks (optional):',
      placeholder: 'https://your-app.com',
      initialValue: existing.APP_BASE_URL ?? '',
    }),
  );

  const loginUrl = await abortIfCancelled(
    clack.text({
      message: 'LOGIN_URL for authenticated journeys (optional):',
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

  // Optional: connect to hosted blop dashboard
  clack.log.message(
    chalk.dim('─── Hosted blop dashboard (optional) ───'),
  );

  const hostedUrl = await abortIfCancelled(
    clack.text({
      message: 'BLOP_HOSTED_URL — workspace URL (leave blank to skip):',
      placeholder: 'https://app.blop.dev/workspace/...',
      initialValue: existing.BLOP_HOSTED_URL ?? '',
    }),
  );

  let apiToken: string | undefined;
  let projectId: string | undefined;

  if (hostedUrl.trim()) {
    const rawApiToken = await abortIfCancelled(
      clack.password({
        message: 'BLOP_API_TOKEN — API token (leave blank to skip):',
        validate: () => undefined,
      }),
    );

    if (rawApiToken.trim()) {
      apiToken = rawApiToken.trim();

      const rawProjectId = await abortIfCancelled(
        clack.text({
          message: 'BLOP_PROJECT_ID — project ID (leave blank to skip):',
          placeholder: 'proj_...',
          initialValue: existing.BLOP_PROJECT_ID ?? '',
        }),
      );
      projectId = rawProjectId.trim() || undefined;
    }
  }

  return {
    BLOP_LLM_PROVIDER: llmProvider,
    GOOGLE_API_KEY: googleApiKey.trim(),
    ANTHROPIC_API_KEY: anthropicApiKey.trim() || undefined,
    OPENAI_API_KEY: openAiApiKey.trim() || undefined,
    APP_BASE_URL: appBaseUrl.trim() || undefined,
    LOGIN_URL: loginUrl.trim() || undefined,
    TEST_USERNAME: testUsername.trim() || undefined,
    TEST_PASSWORD: testPassword.trim() || undefined,
    BLOP_HOSTED_URL: hostedUrl.trim() || undefined,
    BLOP_API_TOKEN: apiToken,
    BLOP_PROJECT_ID: projectId,
  };
}
