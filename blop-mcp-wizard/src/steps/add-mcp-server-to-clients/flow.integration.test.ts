import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import * as jsonc from 'jsonc-parser';
import { addMCPServerToClientsStep, removeMCPServerFromClientsStep } from './index.js';
import { buildDefaultEnv } from '../../defaults.js';

function createTempBlopFixture(): string {
  const sandboxTmpRoot = path.join(process.cwd(), '.tmp-test-fixtures');
  fs.mkdirSync(sandboxTmpRoot, { recursive: true });
  const root = fs.mkdtempSync(path.join(sandboxTmpRoot, 'blop-mcp-flow-'));
  fs.mkdirSync(path.join(root, 'src', 'blop'), { recursive: true });
  fs.writeFileSync(path.join(root, 'pyproject.toml'), '[project]\nname="blop"\n', 'utf8');
  fs.writeFileSync(path.join(root, '.env.example'), 'GOOGLE_API_KEY=\n', 'utf8');
  fs.writeFileSync(path.join(root, 'src', 'blop', 'server.py'), 'def run():\n    pass\n', 'utf8');
  return root;
}

describe('mcp add/remove integration flow', () => {
  it('adds then removes blop server against temp project config', async () => {
    const blopPath = createTempBlopFixture();
    const configPath = path.join(blopPath, 'tmp-cursor-config', 'mcp.json');
    const env = buildDefaultEnv({
      GOOGLE_API_KEY: 'test-key',
      APP_BASE_URL: 'https://example.com',
    });

    const added = await addMCPServerToClientsStep({
      blopPath,
      env,
      ci: true,
      cursorOnly: true,
      includeClaude: false,
      projectCursorConfig: true,
      projectCursorConfigPath: configPath,
    });
    expect(added).toContain('Cursor (project)');

    expect(fs.existsSync(configPath)).toBe(true);
    const rawAfterAdd = fs.readFileSync(configPath, 'utf8');
    const parsedAfterAdd = jsonc.parse(rawAfterAdd) as Record<string, any>;
    expect(parsedAfterAdd.mcpServers.blop.command).toBe('uv');
    expect(parsedAfterAdd.mcpServers.blop.args[1]).toBe(path.resolve(blopPath));
    expect(parsedAfterAdd.mcpServers.blop.env.GOOGLE_API_KEY).toBe('test-key');

    const removed = await removeMCPServerFromClientsStep({
      blopPath,
      ci: true,
      cursorOnly: true,
      includeClaude: false,
      projectCursorConfig: true,
      projectCursorConfigPath: configPath,
    });
    expect(removed).toContain('Cursor (project)');

    const rawAfterRemove = fs.readFileSync(configPath, 'utf8');
    const parsedAfterRemove = jsonc.parse(rawAfterRemove) as Record<string, any>;
    expect(parsedAfterRemove.mcpServers.blop).toBeUndefined();
  });
});

