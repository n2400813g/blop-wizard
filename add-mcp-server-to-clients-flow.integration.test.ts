import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import * as jsonc from 'jsonc-parser';
import {
  addMCPServerToClientsStep,
  removeMCPServerFromClientsStep,
} from './add-mcp-server-to-clients.js';
import { buildDefaultEnv } from './defaults.js';

const tempDirsToClean = new Set<string>();

interface ParsedServerEntry {
  command?: string;
  args?: unknown;
  env?: Record<string, string>;
}

interface ParsedMcpConfig {
  mcpServers: Record<string, ParsedServerEntry | undefined>;
}

function createTempBlopFixture(): string {
  const sandboxTmpRoot = path.join(process.cwd(), '.tmp-test-fixtures');
  fs.mkdirSync(sandboxTmpRoot, { recursive: true });
  const root = fs.mkdtempSync(path.join(sandboxTmpRoot, 'blop-mcp-flow-'));
  tempDirsToClean.add(root);
  fs.mkdirSync(path.join(root, 'src', 'blop'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'pyproject.toml'),
    '[project]\nname="blop"\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(root, '.env.example'),
    'GOOGLE_API_KEY=\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(root, 'src', 'blop', 'server.py'),
    'def run():\n    pass\n',
    'utf8',
  );
  return root;
}

afterEach(() => {
  for (const dir of tempDirsToClean) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirsToClean.clear();
});

describe('mcp add/remove integration flow', () => {
  it('adds then removes blop server against temp project config', async () => {
    const blopPath = createTempBlopFixture();
    const configPath = path.join(blopPath, 'tmp-cursor-config', 'mcp.json');
    const env = buildDefaultEnv(
      {
        GOOGLE_API_KEY: 'test-key',
        APP_BASE_URL: 'https://example.com',
      },
      blopPath,
    );

    const added = await addMCPServerToClientsStep({
      runtimePath: blopPath,
      projectPath: blopPath,
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
    const parsedAfterAdd = jsonc.parse(rawAfterAdd) as ParsedMcpConfig;
    const addedBlopServer = parsedAfterAdd.mcpServers.blop;
    expect(addedBlopServer).toBeTruthy();
    expect(addedBlopServer?.command).toBe(
      path.join(path.resolve(blopPath), '.venv', 'bin', 'blop-mcp'),
    );
    expect(addedBlopServer?.args).toBeUndefined();
    expect(addedBlopServer?.env?.GOOGLE_API_KEY).toBe('test-key');
    expect(addedBlopServer?.env?.BLOP_ENV).toBe('production');
    expect(addedBlopServer?.env?.BLOP_REQUIRE_ABSOLUTE_PATHS).toBe('true');
    expect(addedBlopServer?.env?.BLOP_CAPABILITIES_PROFILE).toBe(
      'production_minimal',
    );
    expect(addedBlopServer?.env?.BLOP_ENABLE_COMPAT_TOOLS).toBe('false');

    const removed = await removeMCPServerFromClientsStep({
      projectPath: blopPath,
      ci: true,
      cursorOnly: true,
      includeClaude: false,
      projectCursorConfig: true,
      projectCursorConfigPath: configPath,
    });
    expect(removed).toContain('Cursor (project)');

    const rawAfterRemove = fs.readFileSync(configPath, 'utf8');
    const parsedAfterRemove = jsonc.parse(rawAfterRemove) as ParsedMcpConfig;
    expect(parsedAfterRemove.mcpServers.blop).toBeUndefined();
  });
});
