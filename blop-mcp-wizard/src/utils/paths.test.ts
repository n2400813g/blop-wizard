import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveBlopPath } from './paths.js';

function setupBlopLikeDir(root: string): string {
  fs.mkdirSync(path.join(root, 'src', 'blop'), { recursive: true });
  fs.writeFileSync(path.join(root, 'pyproject.toml'), '[project]\nname="blop"\n', 'utf8');
  fs.writeFileSync(path.join(root, '.env.example'), 'GOOGLE_API_KEY=\n', 'utf8');
  fs.writeFileSync(path.join(root, 'src', 'blop', 'server.py'), 'def run():\n    pass\n', 'utf8');
  return root;
}

describe('paths', () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it('resolves explicit path when valid', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blop-mcp-path-test-'));
    const blopDir = setupBlopLikeDir(path.join(dir, 'blop-use'));
    expect(resolveBlopPath(blopDir)).toBe(path.resolve(blopDir));
  });

  it('resolves from cwd when cwd is blop-use', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blop-mcp-path-test-'));
    const blopDir = setupBlopLikeDir(path.join(dir, 'blop-use'));
    process.chdir(blopDir);
    expect(fs.realpathSync(resolveBlopPath())).toBe(fs.realpathSync(path.resolve(blopDir)));
  });
});

