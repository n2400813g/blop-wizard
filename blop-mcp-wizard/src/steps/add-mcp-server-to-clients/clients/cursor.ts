import fs from 'fs';
import os from 'os';
import path from 'path';
import { MCPClient } from '../MCPClient.js';
import { buildCursorServerConfig } from '../../../defaults.js';
import type { EnvConfig } from '../../../utils/types.js';

export class CursorMCPClient extends MCPClient {
  name = 'Cursor';

  async isClientSupported(): Promise<boolean> {
    const configPath = await this.getConfigPath();
    const homeCursorDir = process.platform === 'darwin'
      ? path.join(os.homedir(), '.cursor')
      : process.platform === 'linux'
        ? path.join(os.homedir(), '.config', 'cursor')
        : path.join(process.env.APPDATA ?? '', 'Cursor');
    return fs.existsSync(homeCursorDir) || fs.existsSync(configPath);
  }

  async getConfigPath(): Promise<string> {
    if (process.platform === 'win32') {
      return path.join(process.env.APPDATA ?? '', 'Cursor', 'mcp.json');
    }
    if (process.platform === 'linux') {
      return path.join(os.homedir(), '.config', 'cursor', 'mcp.json');
    }
    return path.join(os.homedir(), '.cursor', 'mcp.json');
  }

  getServerPropertyName(): string {
    return 'mcpServers';
  }

  getServerConfig(blopPath: string, env: EnvConfig) {
    return buildCursorServerConfig(blopPath, env);
  }
}

export class CursorProjectMCPClient extends CursorMCPClient {
  name = 'Cursor (project)';

  constructor(
    private readonly blopPath: string,
    private readonly configPathOverride?: string,
  ) {
    super();
  }

  async isClientSupported(): Promise<boolean> {
    return true;
  }

  async getConfigPath(): Promise<string> {
    if (this.configPathOverride) {
      return this.configPathOverride;
    }
    return path.join(this.blopPath, '.cursor', 'mcp.json');
  }
}

