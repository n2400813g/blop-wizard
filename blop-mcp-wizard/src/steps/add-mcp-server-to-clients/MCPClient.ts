import fs from 'fs';
import path from 'path';
import * as jsonc from 'jsonc-parser';
import { SERVER_NAME } from '../../defaults.js';
import type { EnvConfig, MCPClientResult, MCPServerConfig } from '../../utils/types.js';

export abstract class MCPClient {
  abstract name: string;
  abstract getConfigPath(): Promise<string>;
  abstract getServerPropertyName(): string;
  abstract isClientSupported(): Promise<boolean>;

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

