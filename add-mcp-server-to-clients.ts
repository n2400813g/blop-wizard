import chalk from 'chalk';
import clack from './clack.js';
import { abortIfCancelled } from './clack-utils.js';
import type { EnvConfig } from './types.js';
import {
  ClaudeCodeMCPClient,
  CodexMCPClient,
  createClineMCPClient,
  createContinueMCPClient,
  createGeminiCliMCPClient,
  createJetBrainsMCPClient,
  createKiloCodeMCPClient,
  createOpenCodeMCPClient,
  createRooCodeMCPClient,
  createVSCodeMCPClient,
  createWindsurfMCPClient,
  createZedMCPClient,
  CursorMCPClient,
  CursorProjectMCPClient,
} from './add-mcp-server-to-clients-clients.js';
import type { MCPClient } from './add-mcp-server-to-clients-mcp-client.js';

export interface AddMCPServerOptions {
  runtimePath: string;
  projectPath?: string;
  env: EnvConfig;
  ci?: boolean;
  targets?: string[];
  cursorOnly?: boolean;
  includeClaude?: boolean;
  projectCursorConfig?: boolean;
  projectCursorConfigPath?: string;
  clientRegistryOverride?: MCPClient[];
}

interface ClientSelectionOptions {
  projectPath?: string;
  targets?: string[];
  cursorOnly?: boolean;
  includeClaude?: boolean;
  projectCursorConfig?: boolean;
  projectCursorConfigPath?: string;
  clientRegistryOverride?: MCPClient[];
}

export interface RemoveMCPServerOptions extends ClientSelectionOptions {
  ci?: boolean;
}

function createClientRegistry(options: ClientSelectionOptions): MCPClient[] {
  if (options.clientRegistryOverride) {
    return options.clientRegistryOverride;
  }

  const projectPath = options.projectPath ?? process.cwd();
  const clients: MCPClient[] = [];

  if (options.projectCursorConfig) {
    clients.push(
      new CursorProjectMCPClient({
        projectPath,
        configPathOverride: options.projectCursorConfigPath,
      }),
    );
  } else {
    clients.push(new CursorMCPClient());
  }

  clients.push(createVSCodeMCPClient());
  clients.push(createWindsurfMCPClient());
  clients.push(createClineMCPClient());
  clients.push(createContinueMCPClient());
  clients.push(createRooCodeMCPClient());
  clients.push(createGeminiCliMCPClient());
  clients.push(createKiloCodeMCPClient());
  clients.push(createOpenCodeMCPClient());
  clients.push(createZedMCPClient());
  clients.push(createJetBrainsMCPClient());
  clients.push(new CodexMCPClient());
  clients.push(new ClaudeCodeMCPClient());

  return clients;
}

function filterClients(
  clients: MCPClient[],
  options: ClientSelectionOptions,
): MCPClient[] {
  if (options.cursorOnly) {
    return clients.filter((client) => client.id.startsWith('cursor'));
  }

  let selected = [...clients];
  if (options.includeClaude === false) {
    selected = selected.filter((client) => client.id !== 'claude-code');
  }

  if (!options.targets || options.targets.length === 0) {
    return selected;
  }

  const normalizedTargets = options.targets
    .map((target) => target.trim().toLowerCase())
    .filter(Boolean);
  return selected.filter((client) =>
    normalizedTargets.some((target) => client.matchesTarget(target)),
  );
}

function parseUnknownTargets(
  clients: MCPClient[],
  targets?: string[],
): string[] {
  if (!targets || targets.length === 0) return [];
  return targets
    .map((target) => target.trim())
    .filter(Boolean)
    .filter(
      (target) => !clients.some((client) => client.matchesTarget(target)),
    );
}

async function resolveSupportedClients(
  clients: MCPClient[],
): Promise<MCPClient[]> {
  const supported: MCPClient[] = [];
  for (const client of clients) {
    if (await client.isClientSupported()) {
      supported.push(client);
    }
  }
  return supported;
}

function getClients(options: ClientSelectionOptions): MCPClient[] {
  return filterClients(createClientRegistry(options), options);
}

export async function addMCPServerToClientsStep(
  options: AddMCPServerOptions,
): Promise<string[]> {
  const allClients = createClientRegistry(options);
  const unknownTargets = parseUnknownTargets(allClients, options.targets);
  if (unknownTargets.length > 0) {
    clack.log.warn(`Unknown targets skipped: ${unknownTargets.join(', ')}`);
  }

  const clients = filterClients(allClients, options);
  const supported = await resolveSupportedClients(clients);
  if (supported.length === 0) {
    clack.log.warn('No supported clients detected.');
    return [];
  }

  let selected: MCPClient[] = supported;
  if (!options.ci) {
    const selectedNames = await abortIfCancelled(
      clack.multiselect({
        message: 'Select clients to configure:',
        options: supported.map((client) => ({
          value: client.name,
          label: `${client.name} (${client.id})`,
        })),
        initialValues: supported.map((client) => client.name),
        required: true,
      }),
    );
    selected = supported.filter((client) =>
      selectedNames.includes(client.name),
    );
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
      selected = selected.filter(
        (client) => !alreadyInstalled.includes(client),
      );
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
    const result = await client.addServer(options.runtimePath, options.env);
    if (result.success) {
      successes.push(client.name);
    } else {
      failures.push({
        name: client.name,
        error: result.error ?? 'Unknown error',
      });
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
    clack.log.message(
      chalk.dim('Restart your coding clients to load the updated MCP servers.'),
    );
  }

  return successes;
}

export async function removeMCPServerFromClientsStep(
  options: RemoveMCPServerOptions,
): Promise<string[]> {
  const allClients = createClientRegistry(options);
  const unknownTargets = parseUnknownTargets(allClients, options.targets);
  if (unknownTargets.length > 0) {
    clack.log.warn(`Unknown targets skipped: ${unknownTargets.join(', ')}`);
  }
  const clients = getClients(options);

  const removable: MCPClient[] = [];
  for (const client of clients) {
    if (
      (await client.isClientSupported()) &&
      (await client.isServerInstalled())
    ) {
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
          options: removable.map((client) => ({
            value: client.name,
            label: `${client.name} (${client.id})`,
          })),
          initialValues: removable.map((client) => client.name),
          required: true,
        }),
      );
  const selectedClients = removable.filter((client) =>
    selectedNames.includes(client.name),
  );
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
