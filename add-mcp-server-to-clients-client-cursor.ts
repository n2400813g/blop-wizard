import fs from 'fs';
import os from 'os';
import path from 'path';
import { JsonConfigMCPClient } from './add-mcp-server-to-clients-mcp-client.js';
import { buildCursorServerConfig } from './defaults.js';
import type { JsonConfigClientOptions } from './add-mcp-server-to-clients-mcp-client.js';

function defaultCursorConfigPath(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA ?? '', 'Cursor', 'mcp.json');
  }
  if (process.platform === 'linux') {
    return path.join(os.homedir(), '.config', 'cursor', 'mcp.json');
  }
  return path.join(os.homedir(), '.cursor', 'mcp.json');
}

function cursorSupportedCheck(configPath: string): boolean {
  const homeCursorDir =
    process.platform === 'darwin'
      ? path.join(os.homedir(), '.cursor')
      : process.platform === 'linux'
        ? path.join(os.homedir(), '.config', 'cursor')
        : path.join(process.env.APPDATA ?? '', 'Cursor');
  return fs.existsSync(homeCursorDir) || fs.existsSync(configPath);
}

export interface CursorClientOptions {
  id?: string;
  name?: string;
  aliases?: string[];
  configPathResolver?: () => string;
  supportedCheck?: () => boolean;
}

export class CursorMCPClient extends JsonConfigMCPClient {
  constructor(options: CursorClientOptions = {}) {
    const configPathResolver = options.configPathResolver ?? defaultCursorConfigPath;
    const clientOptions: JsonConfigClientOptions = {
      id: options.id ?? 'cursor',
      name: options.name ?? 'Cursor',
      aliases: options.aliases ?? ['cursor-global'],
      configPathResolver,
      serverPropertyName: 'mcpServers',
      serverConfigBuilder: (runtimePath, env) => buildCursorServerConfig(runtimePath, env),
      supportedCheck: options.supportedCheck ?? (() => cursorSupportedCheck(configPathResolver())),
    };
    super(clientOptions);
  }
}

export interface CursorProjectClientOptions {
  projectPath: string;
  configPathOverride?: string;
  supportedCheck?: () => boolean;
}

export class CursorProjectMCPClient extends CursorMCPClient {
  constructor(options: CursorProjectClientOptions) {
    super({
      id: 'cursor-project',
      name: 'Cursor (project)',
      aliases: ['cursor'],
      configPathResolver: () =>
        options.configPathOverride ?? path.join(options.projectPath, '.cursor', 'mcp.json'),
      supportedCheck: options.supportedCheck ?? (() => true),
    });
  }
}
