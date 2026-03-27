import os from 'os';
import path from 'path';
import { commandExists, getVenvBlopMcpPath } from './dependencies.js';
import { buildCursorServerConfig, SERVER_NAME } from './defaults.js';
import {
  CliCommandMCPClient,
  JsonConfigMCPClient,
  buildCliEnvArgs,
  quoteShell,
} from './add-mcp-server-to-clients-mcp-client.js';

type ConfigOverride = {
  configPath?: string;
  forceSupported?: boolean;
};

function makeJsonClient(options: {
  id: string;
  name: string;
  aliases?: string[];
  defaultConfigPath: string;
  override?: ConfigOverride;
  serverPropertyName?: string;
}): JsonConfigMCPClient {
  const resolvedConfigPath = () =>
    options.override?.configPath ?? options.defaultConfigPath;
  return new JsonConfigMCPClient({
    id: options.id,
    name: options.name,
    aliases: options.aliases,
    configPathResolver: resolvedConfigPath,
    serverPropertyName: options.serverPropertyName ?? 'mcpServers',
    serverConfigBuilder: (runtimePath, env) =>
      buildCursorServerConfig(runtimePath, env),
    supportedCheck:
      typeof options.override?.forceSupported === 'boolean'
        ? () => options.override?.forceSupported ?? false
        : undefined,
  });
}

export function createVSCodeMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'vscode',
    name: 'VS Code',
    aliases: ['code'],
    defaultConfigPath: path.join(os.homedir(), '.vscode', 'mcp.json'),
    override,
  });
}

export function createWindsurfMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'windsurf',
    name: 'Windsurf',
    defaultConfigPath: path.join(
      os.homedir(),
      '.codeium',
      'windsurf',
      'mcp_config.json',
    ),
    override,
  });
}

export function createClineMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'cline',
    name: 'Cline',
    defaultConfigPath: path.join(os.homedir(), '.cline', 'mcp_settings.json'),
    override,
  });
}

export function createContinueMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'continue',
    name: 'Continue',
    defaultConfigPath: path.join(os.homedir(), '.continue', 'config.json'),
    override,
  });
}

export function createRooCodeMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'roo-code',
    name: 'Roo Code',
    aliases: ['roo'],
    defaultConfigPath: path.join(os.homedir(), '.roo-code', 'mcp.json'),
    override,
  });
}

export function createGeminiCliMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'gemini-cli',
    name: 'Gemini CLI',
    aliases: ['gemini'],
    defaultConfigPath: path.join(os.homedir(), '.gemini', 'settings.json'),
    override,
  });
}

export function createKiloCodeMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'kilo-code',
    name: 'Kilo Code',
    aliases: ['kilo'],
    defaultConfigPath: path.join(os.homedir(), '.kilocode', 'mcp.json'),
    override,
  });
}

export function createOpenCodeMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'opencode',
    name: 'OpenCode',
    aliases: ['open-code'],
    defaultConfigPath: path.join(os.homedir(), '.opencode', 'config.json'),
    override,
  });
}

export function createZedMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'zed',
    name: 'Zed',
    defaultConfigPath: path.join(
      os.homedir(),
      '.config',
      'zed',
      'settings.json',
    ),
    override,
  });
}

export function createJetBrainsMCPClient(
  override?: ConfigOverride,
): JsonConfigMCPClient {
  return makeJsonClient({
    id: 'jetbrains',
    name: 'JetBrains',
    aliases: ['intellij'],
    defaultConfigPath: path.join(os.homedir(), '.jetbrains', 'mcp.json'),
    override,
  });
}

export class CodexMCPClient extends CliCommandMCPClient {
  constructor() {
    super({
      id: 'codex',
      name: 'Codex CLI/App',
      aliases: ['codex-cli', 'codex-app'],
      commandName: 'codex',
      listCommand: 'codex mcp list',
      addCommandBuilder: (runtimePath, env) => {
        const envArgs = buildCliEnvArgs(env, '--env');
        return `codex mcp add ${SERVER_NAME} ${quoteShell(getVenvBlopMcpPath(runtimePath))} ${envArgs}`.trim();
      },
      removeCommandBuilder: () => `codex mcp remove ${SERVER_NAME}`,
      supportedCheck: () => commandExists('codex'),
    });
  }
}
