import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { readEnvFile, upsertEnvFile, writeJsoncValue } from './config-write.js';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'blop-mcp-wizard-test-'));
}

describe('config-write', () => {
  it('writes nested JSONC value idempotently', () => {
    const dir = makeTempDir();
    const file = path.join(dir, 'mcp.json');
    fs.writeFileSync(file, '{\n  // comment\n  "mcpServers": {}\n}\n', 'utf8');

    writeJsoncValue(file, ['mcpServers', 'blop'], { command: 'uv' });
    writeJsoncValue(file, ['mcpServers', 'blop'], {
      command: 'uv',
      args: ['run'],
    });

    const raw = fs.readFileSync(file, 'utf8');
    expect(raw).toContain('"blop"');
    expect(raw).toContain('"args"');
    expect(raw).toContain('// comment');
  });

  it('upserts env values while preserving existing keys', () => {
    const dir = makeTempDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(
      file,
      'GOOGLE_API_KEY=old\nAPP_BASE_URL=https://old.example\n',
      'utf8',
    );

    upsertEnvFile(file, {
      GOOGLE_API_KEY: 'new',
      LOGIN_URL: 'https://login.example',
    });

    const env = readEnvFile(file);
    expect(env.GOOGLE_API_KEY).toBe('new');
    expect(env.APP_BASE_URL).toBe('https://old.example');
    expect(env.LOGIN_URL).toBe('https://login.example');
  });
});
