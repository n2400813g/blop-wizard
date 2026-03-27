import chalk from 'chalk';
import clack from './clack.js';
import {
  printWelcome,
  printRestartHint,
  abortIfCancelled,
} from './clack-utils.js';
import {
  resolveLocalSourcePath,
  resolveProjectPath,
  resolveRuntimePath,
} from './paths.js';
import { bootstrapBlop } from './bootstrap-blop.js';
import { addMCPServerToClientsStep } from './add-mcp-server-to-clients.js';
import { collectDoctorRows } from './doctor.js';
import {
  DEFAULT_BLOP_PACKAGE_NAME,
  DEFAULT_INSTALL_SOURCE,
} from './defaults.js';
import type { RepairOptions, DoctorRow } from './types.js';

function formatFailingRows(rows: DoctorRow[]): string {
  return rows
    .map((row) => `  - ${row.label}${row.detail ? `: ${row.detail}` : ''}`)
    .join('\n');
}

export async function runRepair(options: RepairOptions = {}): Promise<number> {
  printWelcome();

  const installSource = options.installSource ?? DEFAULT_INSTALL_SOURCE;
  const localSourcePath =
    installSource === 'local'
      ? resolveLocalSourcePath(options.blopPath)
      : undefined;
  const runtimePath = resolveRuntimePath({
    installSource,
    runtimePath: options.runtimePath,
    localSourcePath,
  });
  const projectPath = resolveProjectPath(options.projectPath);
  const packageSpec = options.packageVersion
    ? `${options.packageName ?? DEFAULT_BLOP_PACKAGE_NAME}==${options.packageVersion}`
    : (options.packageName ?? DEFAULT_BLOP_PACKAGE_NAME);

  clack.log.step(`Repair source: ${installSource}`);
  clack.log.step(`Runtime path: ${runtimePath}`);
  if (localSourcePath) {
    clack.log.step(`Local source path: ${localSourcePath}`);
  }
  clack.log.step(`Project path: ${projectPath}`);

  const beforeRows = await collectDoctorRows({
    installSource,
    runtimePath,
    blopPath: options.blopPath,
    packageName: options.packageName,
    packageVersion: options.packageVersion,
    skipPlaywright: options.skipPlaywright,
  });
  const failingBefore = beforeRows.filter((row) => !row.ok);

  if (failingBefore.length === 0) {
    clack.outro(chalk.green('Runtime looks healthy. No repair needed.'));
    return 0;
  }

  clack.log.warn(
    `Repairing these issues:\n${formatFailingRows(failingBefore)}`,
  );

  if (!options.ci) {
    const shouldRepair = await abortIfCancelled(
      clack.confirm({
        message: 'Repair this runtime and refresh MCP client configuration?',
        initialValue: true,
      }),
    );
    if (!shouldRepair) {
      clack.outro(chalk.yellow('Repair cancelled.'));
      return 1;
    }
  }

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

  const afterRows = await collectDoctorRows({
    installSource,
    runtimePath,
    blopPath: options.blopPath,
    packageName: options.packageName,
    packageVersion: options.packageVersion,
    skipPlaywright: options.skipPlaywright,
  });
  const failingAfter = afterRows.filter((row) => !row.ok);

  if (installedClients.length > 0) {
    printRestartHint();
  }

  if (failingAfter.length === 0) {
    clack.outro(chalk.green('blop runtime repaired.'));
    return 0;
  }

  clack.log.error(
    `Repair finished with remaining issues:\n${formatFailingRows(failingAfter)}`,
  );
  clack.outro(
    chalk.yellow('Repair completed, but some checks still need attention.'),
  );
  return 1;
}
