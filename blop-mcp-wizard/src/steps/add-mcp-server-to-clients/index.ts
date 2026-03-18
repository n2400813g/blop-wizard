import chalk from 'chalk';
import clack from '../../utils/clack.js';
import { abortIfCancelled } from '../../utils/clack-utils.js';
import type { EnvConfig } from '../../utils/types.js';
import { ClaudeCodeMCPClient, CursorMCPClient, CursorProjectMCPClient } from './clients/index.js';
import type { MCPClient } from './MCPClient.js';

export interface AddMCPServerOptions {
  blopPath: string;
  env: EnvConfig;
  ci?: boolean;
  cursorOnly?: boolean;
  includeClaude?: boolean;
  projectCursorConfig?: boolean;
  projectCursorConfigPath?: string;
}

interface ClientSelectionOptions {
  blopPath: string;
  cursorOnly?: boolean;
  includeClaude?: boolean;
  projectCursorConfig?: boolean;
  projectCursorConfigPath?: string;
}

export interface RemoveMCPServerOptions extends ClientSelectionOptions {
  ci?: boolean;
}

function getClients(options: ClientSelectionOptions): MCPClient[] {
  const clients: MCPClient[] = [];
  if (options.projectCursorConfig) {
    clients.push(new CursorProjectMCPClient(options.blopPath, options.projectCursorConfigPath));
  } else {
    clients.push(new CursorMCPClient());
  }
  if (!options.cursorOnly && options.includeClaude !== false) {
    clients.push(new ClaudeCodeMCPClient());
  }
  return clients;
}

export async function addMCPServerToClientsStep(options: AddMCPServerOptions): Promise<string[]> {
  const clients = getClients(options);
  const supported: MCPClient[] = [];

  for (const client of clients) {
    if (await client.isClientSupported()) {
      supported.push(client);
    }
  }

  if (supported.length === 0) {
    clack.log.warn('No supported clients detected.');
    return [];
  }

  let selected: MCPClient[] = supported;
  if (!options.ci) {
    const selectedNames = await abortIfCancelled(
      clack.multiselect({
        message: 'Select clients to configure:',
        options: supported.map((client) => ({ value: client.name, label: client.name })),
        initialValues: supported.map((client) => client.name),
        required: true,
      }),
    );
    selected = supported.filter((client) => selectedNames.includes(client.name));
  }

  const alreadyInstalled: MCPClient[] = [];
  for (const client of selected) {
    if (await client.isServerInstalled()) {
      alreadyInstalled.push(client);
    }
  }

  if (alreadyInstalled.length > 0 && !options.ci) {
    clack.log.warn(
      `blop already configured for:\n  ${alreadyInstalled.map((client) => `- ${client.name}`).join('\n  ')}`,
    );
    const shouldReinstall = await abortIfCancelled(
      clack.confirm({
        message: 'Overwrite existing server configuration?',
        initialValue: true,
      }),
    );
    if (!shouldReinstall) {
      selected = selected.filter((client) => !alreadyInstalled.includes(client));
    }
  }

  if (selected.length === 0) {
    clack.log.info('Nothing selected to install.');
    return [];
  }

  const spinner = clack.spinner();
  spinner.start('Writing MCP configuration...');
  const successes: string[] = [];
  const failures: Array<{ name: string; error: string }> = [];

  for (const client of selected) {
    const result = await client.addServer(options.blopPath, options.env);
    if (result.success) {
      successes.push(client.name);
    } else {
      failures.push({ name: client.name, error: result.error ?? 'Unknown error' });
    }
  }
  spinner.stop('Client setup complete');

  if (successes.length > 0) {
    clack.log.success(`Configured: ${successes.join(', ')}`);
  }
  if (failures.length > 0) {
    clack.log.error(
      `Failed:\n${failures.map((item) => `  - ${item.name}: ${item.error}`).join('\n')}`,
    );
  }

  if (successes.length > 0) {
    clack.log.message(chalk.dim('Restart your coding clients to load the updated MCP servers.'));
  }

  return successes;
}

export async function removeMCPServerFromClientsStep(
  options: RemoveMCPServerOptions,
): Promise<string[]> {
  const clients = getClients({
    blopPath: options.blopPath,
    projectCursorConfig: options.projectCursorConfig,
    projectCursorConfigPath: options.projectCursorConfigPath,
    includeClaude: options.includeClaude,
    cursorOnly: options.cursorOnly,
  });

  const removable: MCPClient[] = [];
  for (const client of clients) {
    if ((await client.isClientSupported()) && (await client.isServerInstalled())) {
      removable.push(client);
    }
  }

  if (removable.length === 0) {
    clack.log.info('No installed blop MCP servers found.');
    return [];
  }

  const selectedNames = options.ci
    ? removable.map((client) => client.name)
    : await abortIfCancelled(
        clack.multiselect({
          message: 'Remove blop from which clients?',
          options: removable.map((client) => ({ value: client.name, label: client.name })),
          initialValues: removable.map((client) => client.name),
          required: true,
        }),
      );
  const selectedClients = removable.filter((client) => selectedNames.includes(client.name));
  const removed: string[] = [];
  for (const client of selectedClients) {
    const result = await client.removeServer();
    if (result.success) removed.push(client.name);
  }
  if (removed.length > 0) {
    clack.log.success(`Removed from: ${removed.join(', ')}`);
  }
  return removed;
}

