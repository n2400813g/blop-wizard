import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveLocalSourcePath, resolveProjectPath, resolveRuntimePath } from './paths.js';

function setupBlopLikeDir(root: string): string {
  fs.mkdirSync(path.join(root, 'src', 'blop'), { recursive: true });
  fs.writeFileSync(path.join(root, 'pyproject.toml'), '[project]\nname="blop"\n', 'utf8');
  fs.writeFileSync(path.join(root, '.env.example'), 'GOOGLE_API_KEY=\n', 'utf8');
  fs.writeFileSync(path.join(root, 'src', 'blop', 'server.py'), 'def run():\n    pass\n', 'utf8');
  return root;
}

describe('paths', () => {
  const originalCwd = process.cwd();
  const originalRuntimePath = process.env.BLOP_RUNTIME_PATH;

  afterEach(() => {
    process.chdir(originalCwd);
    if (typeof originalRuntimePath === 'string') {
      process.env.BLOP_RUNTIME_PATH = originalRuntimePath;
    } else {
      delete process.env.BLOP_RUNTIME_PATH;
    }
  });

  it('resolves explicit local source path when valid', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blop-mcp-path-test-'));
    const blopDir = setupBlopLikeDir(path.join(dir, 'blop-use'));
    expect(resolveLocalSourcePath(blopDir)).toBe(
      path.resolve(blopDir),
    );
  });

  it('resolves local source from cwd when cwd is blop source', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blop-mcp-path-test-'));
    const blopDir = setupBlopLikeDir(path.join(dir, 'blop-use'));
    process.chdir(blopDir);
    expect(fs.realpathSync(resolveLocalSourcePath())).toBe(
      fs.realpathSync(path.resolve(blopDir)),
    );
  });

  it('keeps local install runtime separate from local source path', () => {
    const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blop-mcp-runtime-test-'));
    expect(resolveRuntimePath({ installSource: 'local', runtimePath: runtimeDir })).toBe(path.resolve(runtimeDir));
  });

  it('resolves pypi runtime path from explicit arg', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blop-mcp-runtime-test-'));
    expect(resolveRuntimePath({ installSource: 'pypi', runtimePath: dir })).toBe(path.resolve(dir));
  });

  it('resolves pypi runtime path from env var', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blop-mcp-runtime-test-'));
    process.env.BLOP_RUNTIME_PATH = dir;
    expect(resolveRuntimePath({ installSource: 'pypi' })).toBe(path.resolve(dir));
  });

  it('resolves project path to cwd by default', () => {
    expect(resolveProjectPath()).toBe(path.resolve(process.cwd()));
  });
});
