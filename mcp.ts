import chalk from 'chalk';
import clack from './clack.js';
import { resolveLocalSourcePath, resolveProjectPath, resolveRuntimePath } from './paths.js';
import { bootstrapBlop } from './bootstrap-blop.js';
import {
  addMCPServerToClientsStep,
  removeMCPServerFromClientsStep,
} from './add-mcp-server-to-clients.js';
import { DEFAULT_BLOP_PACKAGE_NAME, DEFAULT_INSTALL_SOURCE } from './defaults.js';
import type { InstallSource } from './types.js';

export interface MCPAddOptions {
  installSource?: InstallSource;
  runtimePath?: string;
  blopPath?: string;
  projectPath?: string;
  packageName?: string;
  packageVersion?: string;
  ci?: boolean;
  targets?: string[];
  cursorOnly?: boolean;
  includeClaude?: boolean;
  projectCursorConfig?: boolean;
  skipPlaywright?: boolean;
}

export interface MCPRemoveOptions {
  projectPath?: string;
  projectCursorConfig?: boolean;
  ci?: boolean;
  targets?: string[];
  cursorOnly?: boolean;
  includeClaude?: boolean;
}

export async function runMCPAdd(options: MCPAddOptions): Promise<void> {
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
    projectCursorConfig: options.projectCursorConfig ?? true,
  });
  if (installedClients.length > 0) {
    clack.outro(chalk.green('blop MCP setup complete.'));
  } else {
    clack.outro(chalk.yellow('No client configuration was changed.'));
  }
}

export async function runMCPRemove(options: MCPRemoveOptions): Promise<void> {
  const projectPath = resolveProjectPath(options.projectPath);
  const removed = await removeMCPServerFromClientsStep({
    projectPath,
    projectCursorConfig: options.projectCursorConfig ?? true,
    ci: options.ci,
    targets: options.targets,
    cursorOnly: options.cursorOnly,
    includeClaude: options.includeClaude,
  });
  if (removed.length > 0) {
    clack.outro(chalk.green('Removed blop MCP configuration.'));
  } else {
    clack.outro(chalk.yellow('No blop MCP configuration removed.'));
  }
}
