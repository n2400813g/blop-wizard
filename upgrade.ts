import fs from 'fs';
import path from 'path';
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
import type { UpgradeOptions, DoctorRow } from './types.js';

function formatFailingRows(rows: DoctorRow[]): string {
  return rows
    .map((row) => `  - ${row.label}${row.detail ? `: ${row.detail}` : ''}`)
    .join('\n');
}

function hasExistingRuntime(runtimePath: string): boolean {
  return (
    fs.existsSync(runtimePath) &&
    (fs.existsSync(path.join(runtimePath, '.venv')) ||
      fs.existsSync(path.join(runtimePath, '.env')))
  );
}

async function resolveUpgradeMode(
  options: UpgradeOptions,
  runtimeExists: boolean,
): Promise<'upgrade' | 'reinstall'> {
  if (options.reinstall) {
    return 'reinstall';
  }
  if (options.ci || !runtimeExists) {
    return 'upgrade';
  }
  return abortIfCancelled(
    clack.select({
      message: 'How should the existing runtime be updated?',
      options: [
        {
          value: 'upgrade',
          label: 'Upgrade in place',
          hint: 'Keep the existing virtualenv and refresh package/config',
        },
        {
          value: 'reinstall',
          label: 'Reinstall runtime',
          hint: 'Recreate the virtualenv cleanly and keep runtime .env/config',
        },
      ],
      initialValue: 'upgrade',
    }),
  );
}

export async function runUpgrade(
  options: UpgradeOptions = {},
): Promise<number> {
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
  const runtimeExists = hasExistingRuntime(runtimePath);
  const mode = await resolveUpgradeMode(options, runtimeExists);

  clack.log.step(`Upgrade source: ${installSource}`);
  clack.log.step(`Runtime path: ${runtimePath}`);
  if (localSourcePath) {
    clack.log.step(`Local source path: ${localSourcePath}`);
  }
  clack.log.step(`Project path: ${projectPath}`);
  clack.log.step(`Mode: ${mode}`);

  if (!runtimeExists) {
    clack.log.info(
      'No existing runtime detected. Running first-time install flow against this runtime path.',
    );
  } else if (mode === 'reinstall') {
    clack.log.warn(
      'Reinstall will recreate the managed virtualenv but preserve the runtime .env file.',
    );
  }

  const beforeRows = runtimeExists
    ? await collectDoctorRows({
        installSource,
        runtimePath,
        blopPath: options.blopPath,
        packageName: options.packageName,
        packageVersion: options.packageVersion,
        skipPlaywright: options.skipPlaywright,
      })
    : [];
  const failingBefore = beforeRows.filter((row) => !row.ok);
  if (failingBefore.length > 0) {
    clack.log.warn(
      `Existing runtime issues before upgrade:\n${formatFailingRows(failingBefore)}`,
    );
  }

  if (!options.ci) {
    const shouldContinue = await abortIfCancelled(
      clack.confirm({
        message:
          mode === 'reinstall'
            ? 'Continue and recreate the runtime virtualenv?'
            : 'Continue and upgrade the existing runtime in place?',
        initialValue: true,
      }),
    );
    if (!shouldContinue) {
      clack.outro(chalk.yellow('Upgrade cancelled.'));
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
    reinstall: mode === 'reinstall',
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
    clack.outro(
      chalk.green(
        mode === 'reinstall'
          ? 'blop runtime reinstalled.'
          : 'blop runtime upgraded.',
      ),
    );
    return 0;
  }

  clack.log.error(
    `Upgrade finished with remaining issues:\n${formatFailingRows(failingAfter)}`,
  );
  clack.outro(
    chalk.yellow('Upgrade completed, but some checks still need attention.'),
  );
  return 1;
}
