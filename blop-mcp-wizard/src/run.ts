import chalk from 'chalk';
import clack from './utils/clack.js';
import { printWelcome, printRestartHint } from './utils/clack-utils.js';
import { resolveBlopPath } from './utils/paths.js';
import { bootstrapBlop } from './steps/bootstrap-blop/index.js';
import { addMCPServerToClientsStep } from './steps/add-mcp-server-to-clients/index.js';
import type { WizardOptions } from './utils/types.js';

export async function runWizard(options: WizardOptions = {}): Promise<void> {
  printWelcome();
  const blopPath = resolveBlopPath(options.blopPath);
  clack.log.step(`Using blop-use at: ${blopPath}`);

  const { env } = await bootstrapBlop({
    blopPath,
    ci: options.ci,
  });

  const installedClients = await addMCPServerToClientsStep({
    blopPath,
    env,
    ci: options.ci,
    cursorOnly: options.cursorOnly,
    includeClaude: options.includeClaude,
    projectCursorConfig: true,
  });

  if (installedClients.length > 0) {
    printRestartHint();
    clack.outro(chalk.green('blop MCP is ready.'));
  } else {
    clack.outro(chalk.yellow('No changes made.'));
  }
}

