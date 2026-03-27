import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import * as jsonc from 'jsonc-parser';
import { buildDefaultEnv, SERVER_NAME } from './defaults.js';
import {
  addMCPServerToClientsStep,
  removeMCPServerFromClientsStep,
} from './add-mcp-server-to-clients.js';
import type { MCPClient } from './add-mcp-server-to-clients-mcp-client.js';
import {
  CursorMCPClient,
  CursorProjectMCPClient,
} from './add-mcp-server-to-clients-client-cursor.js';
import {
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
} from './add-mcp-server-to-clients-client-vibe-tools.js';

const tempDirsToClean = new Set<string>();

interface ParsedServerEntry {
  command?: string;
  args?: unknown;
  env?: Record<string, string>;
}

interface ParsedMcpConfig {
  mcpServers: Record<string, ParsedServerEntry | undefined>;
}

function createTempDir(prefix: string): string {
  const sandboxTmpRoot = path.join(process.cwd(), '.tmp-test-fixtures');
  fs.mkdirSync(sandboxTmpRoot, { recursive: true });
  const dir = fs.mkdtempSync(path.join(sandboxTmpRoot, prefix));
  tempDirsToClean.add(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirsToClean) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirsToClean.clear();
});

describe('mcp matrix add/remove flow', () => {
  it('supports priority JSON vibecoding clients with target filtering', async () => {
    const runtimePath = createTempDir('blop-mcp-matrix-runtime-');
    const configRoot = createTempDir('blop-mcp-matrix-config-');
    const env = buildDefaultEnv(
      {
        GOOGLE_API_KEY: 'matrix-test-key',
        APP_BASE_URL: 'https://example.com',
      },
      runtimePath,
    );

    const cases = [
      {
        id: 'cursor-project',
        name: 'Cursor (project)',
        configPath: path.join(configRoot, 'cursor-project', 'mcp.json'),
        client: new CursorProjectMCPClient({
          projectPath: configRoot,
          configPathOverride: path.join(
            configRoot,
            'cursor-project',
            'mcp.json',
          ),
          supportedCheck: () => true,
        }),
      },
      {
        id: 'cursor',
        name: 'Cursor',
        configPath: path.join(configRoot, 'cursor-global', 'mcp.json'),
        client: new CursorMCPClient({
          id: 'cursor',
          name: 'Cursor',
          configPathResolver: () =>
            path.join(configRoot, 'cursor-global', 'mcp.json'),
          supportedCheck: () => true,
        }),
      },
      {
        id: 'vscode',
        name: 'VS Code',
        configPath: path.join(configRoot, 'vscode', 'mcp.json'),
        client: createVSCodeMCPClient({
          configPath: path.join(configRoot, 'vscode', 'mcp.json'),
          forceSupported: true,
        }),
      },
      {
        id: 'windsurf',
        name: 'Windsurf',
        configPath: path.join(configRoot, 'windsurf', 'mcp_config.json'),
        client: createWindsurfMCPClient({
          configPath: path.join(configRoot, 'windsurf', 'mcp_config.json'),
          forceSupported: true,
        }),
      },
      {
        id: 'cline',
        name: 'Cline',
        configPath: path.join(configRoot, 'cline', 'mcp_settings.json'),
        client: createClineMCPClient({
          configPath: path.join(configRoot, 'cline', 'mcp_settings.json'),
          forceSupported: true,
        }),
      },
      {
        id: 'continue',
        name: 'Continue',
        configPath: path.join(configRoot, 'continue', 'config.json'),
        client: createContinueMCPClient({
          configPath: path.join(configRoot, 'continue', 'config.json'),
          forceSupported: true,
        }),
      },
      {
        id: 'roo-code',
        name: 'Roo Code',
        configPath: path.join(configRoot, 'roo-code', 'mcp.json'),
        client: createRooCodeMCPClient({
          configPath: path.join(configRoot, 'roo-code', 'mcp.json'),
          forceSupported: true,
        }),
      },
      {
        id: 'gemini-cli',
        name: 'Gemini CLI',
        configPath: path.join(configRoot, 'gemini', 'settings.json'),
        client: createGeminiCliMCPClient({
          configPath: path.join(configRoot, 'gemini', 'settings.json'),
          forceSupported: true,
        }),
      },
      {
        id: 'kilo-code',
        name: 'Kilo Code',
        configPath: path.join(configRoot, 'kilo-code', 'mcp.json'),
        client: createKiloCodeMCPClient({
          configPath: path.join(configRoot, 'kilo-code', 'mcp.json'),
          forceSupported: true,
        }),
      },
      {
        id: 'opencode',
        name: 'OpenCode',
        configPath: path.join(configRoot, 'opencode', 'config.json'),
        client: createOpenCodeMCPClient({
          configPath: path.join(configRoot, 'opencode', 'config.json'),
          forceSupported: true,
        }),
      },
      {
        id: 'zed',
        name: 'Zed',
        configPath: path.join(configRoot, 'zed', 'settings.json'),
        client: createZedMCPClient({
          configPath: path.join(configRoot, 'zed', 'settings.json'),
          forceSupported: true,
        }),
      },
      {
        id: 'jetbrains',
        name: 'JetBrains',
        configPath: path.join(configRoot, 'jetbrains', 'mcp.json'),
        client: createJetBrainsMCPClient({
          configPath: path.join(configRoot, 'jetbrains', 'mcp.json'),
          forceSupported: true,
        }),
      },
    ] as const;

    const clientRegistryOverride = cases.map(
      (clientCase) => clientCase.client,
    ) as MCPClient[];
    for (const clientCase of cases) {
      const added = await addMCPServerToClientsStep({
        runtimePath,
        projectPath: configRoot,
        env,
        ci: true,
        targets: [clientCase.id],
        projectCursorConfig: false,
        clientRegistryOverride,
      });
      expect(added).toContain(clientCase.name);

      const rawAfterAdd = fs.readFileSync(clientCase.configPath, 'utf8');
      const parsedAfterAdd = jsonc.parse(rawAfterAdd) as ParsedMcpConfig;
      const addedServer = parsedAfterAdd.mcpServers[SERVER_NAME];
      expect(addedServer).toBeTruthy();
      expect(addedServer?.command).toBe(
        path.join(path.resolve(runtimePath), '.venv', 'bin', 'blop-mcp'),
      );
      expect(addedServer?.args).toBeUndefined();
      expect(addedServer?.env?.GOOGLE_API_KEY).toBe('matrix-test-key');
      expect(addedServer?.env?.BLOP_ENV).toBe('production');
      expect(addedServer?.env?.BLOP_RUNS_DIR).toBe(
        path.join(path.resolve(runtimePath), 'runs'),
      );

      const addedAgain = await addMCPServerToClientsStep({
        runtimePath,
        projectPath: configRoot,
        env,
        ci: true,
        targets: [clientCase.id],
        projectCursorConfig: false,
        clientRegistryOverride,
      });
      expect(addedAgain).toContain(clientCase.name);
      const rawAfterSecondAdd = fs.readFileSync(clientCase.configPath, 'utf8');
      const parsedAfterSecondAdd = jsonc.parse(
        rawAfterSecondAdd,
      ) as ParsedMcpConfig;
      expect(parsedAfterSecondAdd.mcpServers[SERVER_NAME]).toBeTruthy();

      const removed = await removeMCPServerFromClientsStep({
        projectPath: configRoot,
        ci: true,
        targets: [clientCase.id],
        projectCursorConfig: false,
        clientRegistryOverride,
      });
      expect(removed).toContain(clientCase.name);

      const rawAfterRemove = fs.readFileSync(clientCase.configPath, 'utf8');
      const parsedAfterRemove = jsonc.parse(rawAfterRemove) as ParsedMcpConfig;
      expect(parsedAfterRemove.mcpServers?.[SERVER_NAME]).toBeUndefined();
    }
  });
});
