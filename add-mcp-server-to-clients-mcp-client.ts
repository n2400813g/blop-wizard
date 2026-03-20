import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as jsonc from 'jsonc-parser';
import { SERVER_NAME } from './defaults.js';
import type { EnvConfig, MCPClientResult, MCPServerConfig } from './types.js';
import { commandExists } from './dependencies.js';

function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function runShell(command: string): { ok: boolean; stdout: string; stderr: string } {
  try {
    const output = execSync(command, {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
      shell: '/bin/sh',
    });
    return { ok: true, stdout: output, stderr: '' };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    return { ok: false, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

export abstract class MCPClient {
  abstract id: string;
  abstract name: string;
  aliases: string[] = [];
  abstract getConfigPath(): Promise<string>;
  abstract getServerPropertyName(): string;
  abstract isClientSupported(): Promise<boolean>;

  matchesTarget(rawTarget: string): boolean {
    const target = rawTarget.toLowerCase();
    if (this.id.toLowerCase() === target) return true;
    if (this.name.toLowerCase() === target) return true;
    return this.aliases.some((alias) => alias.toLowerCase() === target);
  }

  async isServerInstalled(): Promise<boolean> {
    try {
      const configPath = await this.getConfigPath();
      if (!fs.existsSync(configPath)) return false;
      const raw = fs.readFileSync(configPath, 'utf8');
      const config = jsonc.parse(raw) as Record<string, unknown>;
      const prop = this.getServerPropertyName();
      return (
        typeof config[prop] === 'object' &&
        config[prop] !== null &&
        SERVER_NAME in (config[prop] as Record<string, unknown>)
      );
    } catch {
      return false;
    }
  }

  getServerConfig(_blopPath: string, _env: EnvConfig): MCPServerConfig {
    throw new Error(`${this.name} client does not implement getServerConfig()`);
  }

  async addServer(blopPath: string, env: EnvConfig): Promise<MCPClientResult> {
    try {
      const configPath = await this.getConfigPath();
      const configDir = path.dirname(configPath);
      fs.mkdirSync(configDir, { recursive: true });
      const original = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '{}\n';
      const edits = jsonc.modify(
        original,
        [this.getServerPropertyName(), SERVER_NAME],
        this.getServerConfig(blopPath, env),
        { formattingOptions: { insertSpaces: true, tabSize: 2 } },
      );
      const next = jsonc.applyEdits(original, edits);
      fs.writeFileSync(configPath, next, 'utf8');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async removeServer(): Promise<MCPClientResult> {
    try {
      const configPath = await this.getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { success: false, error: 'Config file not found' };
      }
      const original = fs.readFileSync(configPath, 'utf8');
      const edits = jsonc.modify(
        original,
        [this.getServerPropertyName(), SERVER_NAME],
        undefined,
        { formattingOptions: { insertSpaces: true, tabSize: 2 } },
      );
      const next = jsonc.applyEdits(original, edits);
      fs.writeFileSync(configPath, next, 'utf8');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export interface JsonConfigClientOptions {
  id: string;
  name: string;
  aliases?: string[];
  configPathResolver: () => string | Promise<string>;
  serverPropertyName?: string;
  serverConfigBuilder: (runtimePath: string, env: EnvConfig) => MCPServerConfig;
  supportedCheck?: () => boolean | Promise<boolean>;
}

export class JsonConfigMCPClient extends MCPClient {
  id: string;
  name: string;
  aliases: string[];
  private readonly configPathResolver: () => string | Promise<string>;
  private readonly serverPropertyName: string;
  private readonly serverConfigBuilder: (runtimePath: string, env: EnvConfig) => MCPServerConfig;
  private readonly supportedCheck?: () => boolean | Promise<boolean>;

  constructor(options: JsonConfigClientOptions) {
    super();
    this.id = options.id;
    this.name = options.name;
    this.aliases = options.aliases ?? [];
    this.configPathResolver = options.configPathResolver;
    this.serverPropertyName = options.serverPropertyName ?? 'mcpServers';
    this.serverConfigBuilder = options.serverConfigBuilder;
    this.supportedCheck = options.supportedCheck;
  }

  async getConfigPath(): Promise<string> {
    return this.configPathResolver();
  }

  getServerPropertyName(): string {
    return this.serverPropertyName;
  }

  getServerConfig(runtimePath: string, env: EnvConfig): MCPServerConfig {
    return this.serverConfigBuilder(runtimePath, env);
  }

  async isClientSupported(): Promise<boolean> {
    if (this.supportedCheck) {
      return this.supportedCheck();
    }
    const configPath = await this.getConfigPath();
    return fs.existsSync(configPath) || fs.existsSync(path.dirname(configPath));
  }
}

export interface CliCommandMCPClientOptions {
  id: string;
  name: string;
  aliases?: string[];
  commandName: string;
  listCommand: string;
  addCommandBuilder: (runtimePath: string, env: EnvConfig) => string;
  removeCommandBuilder?: () => string;
  supportedCheck?: () => boolean | Promise<boolean>;
}

export class CliCommandMCPClient extends MCPClient {
  id: string;
  name: string;
  aliases: string[];
  private readonly commandName: string;
  private readonly listCommand: string;
  private readonly addCommandBuilder: (runtimePath: string, env: EnvConfig) => string;
  private readonly removeCommandBuilder: () => string;
  private readonly supportedCheck?: () => boolean | Promise<boolean>;

  constructor(options: CliCommandMCPClientOptions) {
    super();
    this.id = options.id;
    this.name = options.name;
    this.aliases = options.aliases ?? [];
    this.commandName = options.commandName;
    this.listCommand = options.listCommand;
    this.addCommandBuilder = options.addCommandBuilder;
    this.removeCommandBuilder = options.removeCommandBuilder ?? (() => `${this.commandName} mcp remove ${SERVER_NAME}`);
    this.supportedCheck = options.supportedCheck;
  }

  async getConfigPath(): Promise<string> {
    throw new Error(`${this.name} is CLI-configured, no mcp.json path.`);
  }

  getServerPropertyName(): string {
    return 'mcpServers';
  }

  async isClientSupported(): Promise<boolean> {
    if (this.supportedCheck) {
      return this.supportedCheck();
    }
    return commandExists(this.commandName);
  }

  async isServerInstalled(): Promise<boolean> {
    if (!(await this.isClientSupported())) return false;
    const result = runShell(this.listCommand);
    return result.ok && result.stdout.includes(SERVER_NAME);
  }

  async addServer(runtimePath: string, env: EnvConfig): Promise<MCPClientResult> {
    if (!(await this.isClientSupported())) {
      return { success: false, error: `${this.commandName} CLI not found in PATH` };
    }
    const result = runShell(this.addCommandBuilder(runtimePath, env));
    if (result.ok) return { success: true };
    return {
      success: false,
      error: result.stderr.trim() || result.stdout.trim() || `Failed to add MCP server in ${this.name}`,
    };
  }

  async removeServer(): Promise<MCPClientResult> {
    if (!(await this.isClientSupported())) {
      return { success: false, error: `${this.commandName} CLI not found in PATH` };
    }
    const result = runShell(this.removeCommandBuilder());
    if (result.ok) return { success: true };
    return {
      success: false,
      error: result.stderr.trim() || result.stdout.trim() || `Failed to remove MCP server from ${this.name}`,
    };
  }
}

export function buildCliEnvArgs(env: EnvConfig, flag = '-e'): string {
  const envArgs: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'undefined' || value === '') continue;
    envArgs.push(`${flag} ${shellEscape(`${key}=${value}`)}`);
  }
  return envArgs.join(' ');
}

export function quoteShell(value: string): string {
  return shellEscape(value);
}
