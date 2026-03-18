import path from 'path';
import { execSync } from 'child_process';
import { MCPClient } from '../MCPClient.js';
import { SERVER_NAME } from '../../../defaults.js';
import type { EnvConfig, MCPClientResult } from '../../../utils/types.js';
import { canUseClaudeCli } from '../../../utils/dependencies.js';

function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export class ClaudeCodeMCPClient extends MCPClient {
  name = 'Claude Code';

  async isClientSupported(): Promise<boolean> {
    return canUseClaudeCli();
  }

  async getConfigPath(): Promise<string> {
    throw new Error('Claude Code is CLI-configured, no mcp.json path.');
  }

  getServerPropertyName(): string {
    return 'mcpServers';
  }

  async isServerInstalled(): Promise<boolean> {
    if (!canUseClaudeCli()) return false;
    try {
      const output = execSync('claude mcp list', {
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
        shell: '/bin/sh',
      });
      return output.includes(SERVER_NAME);
    } catch {
      return false;
    }
  }

  async addServer(blopPath: string, env: EnvConfig): Promise<MCPClientResult> {
    if (!canUseClaudeCli()) {
      return { success: false, error: 'claude CLI not found in PATH' };
    }
    try {
      const binaryPath = path.join(blopPath, '.venv', 'bin', 'blop-mcp');
      const envArgs: string[] = [];
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === 'undefined' || value === '') continue;
        envArgs.push(`-e ${shellEscape(`${key}=${value}`)}`);
      }
      const command = `claude mcp add ${SERVER_NAME} ${shellEscape(binaryPath)} ${envArgs.join(' ')}`.trim();
      execSync(command, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: '/bin/sh',
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async removeServer(): Promise<MCPClientResult> {
    if (!canUseClaudeCli()) {
      return { success: false, error: 'claude CLI not found in PATH' };
    }
    try {
      execSync(`claude mcp remove ${SERVER_NAME}`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: '/bin/sh',
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

