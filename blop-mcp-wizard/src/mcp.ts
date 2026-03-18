import chalk from 'chalk';
import clack from './utils/clack.js';
import { resolveBlopPath } from './utils/paths.js';
import { bootstrapBlop } from './steps/bootstrap-blop/index.js';
import {
  addMCPServerToClientsStep,
  removeMCPServerFromClientsStep,
} from './steps/add-mcp-server-to-clients/index.js';

export interface MCPAddOptions {
  blopPath?: string;
  ci?: boolean;
  cursorOnly?: boolean;
  includeClaude?: boolean;
  projectCursorConfig?: boolean;
}

export interface MCPRemoveOptions {
  blopPath?: string;
  projectCursorConfig?: boolean;
  ci?: boolean;
  cursorOnly?: boolean;
  includeClaude?: boolean;
}

export async function runMCPAdd(options: MCPAddOptions): Promise<void> {
  const blopPath = resolveBlopPath(options.blopPath);
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
    projectCursorConfig: options.projectCursorConfig ?? true,
  });
  if (installedClients.length > 0) {
    clack.outro(chalk.green('blop MCP setup complete.'));
  } else {
    clack.outro(chalk.yellow('No client configuration was changed.'));
  }
}

export async function runMCPRemove(options: MCPRemoveOptions): Promise<void> {
  const blopPath = resolveBlopPath(options.blopPath);
  const removed = await removeMCPServerFromClientsStep({
    blopPath,
    projectCursorConfig: options.projectCursorConfig ?? true,
    ci: options.ci,
    cursorOnly: options.cursorOnly,
    includeClaude: options.includeClaude,
  });
  if (removed.length > 0) {
    clack.outro(chalk.green('Removed blop MCP configuration.'));
  } else {
    clack.outro(chalk.yellow('No blop MCP configuration removed.'));
  }
}

