import chalk from 'chalk';
import clack from './clack.js';
import { printWelcome, printRestartHint } from './clack-utils.js';
import { resolveLocalSourcePath, resolveProjectPath, resolveRuntimePath } from './paths.js';
import { bootstrapBlop } from './bootstrap-blop.js';
import { addMCPServerToClientsStep } from './add-mcp-server-to-clients.js';
import type { WizardOptions } from './types.js';
import { DEFAULT_BLOP_PACKAGE_NAME, DEFAULT_INSTALL_SOURCE } from './defaults.js';

export async function runWizard(options: WizardOptions = {}): Promise<void> {
  printWelcome();
  const installSource = options.installSource ?? DEFAULT_INSTALL_SOURCE;
  const localSourcePath = installSource === 'local' ? resolveLocalSourcePath(options.blopPath) : undefined;
  const runtimePath = resolveRuntimePath({
    installSource,
    runtimePath: options.runtimePath,
    localSourcePath,
  });
  const projectPath = resolveProjectPath(options.projectPath);
  const packageSpec = options.packageVersion
    ? `${options.packageName ?? DEFAULT_BLOP_PACKAGE_NAME}==${options.packageVersion}`
    : (options.packageName ?? DEFAULT_BLOP_PACKAGE_NAME);

  clack.log.step(`Install source: ${installSource}`);
  clack.log.step(`Runtime path: ${runtimePath}`);
  if (localSourcePath) {
    clack.log.step(`Local source path: ${localSourcePath}`);
  }
  clack.log.step(`Project path: ${projectPath}`);

  const { env } = await bootstrapBlop({
    installSource,
    runtimePath,
    localSourcePath,
    packageSpec,
    ci: options.ci,
    skipPlaywright: options.skipPlaywright,
  });

  const installedClients = await addMCPServerToClientsStep({
    runtimePath,
    projectPath,
    env,
    ci: options.ci,
    targets: options.targets,
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
