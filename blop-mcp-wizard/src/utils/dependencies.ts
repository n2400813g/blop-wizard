import { execSync, spawnSync } from 'child_process';
import path from 'path';
import clack from './clack.js';
import type { BootstrapOptions } from './types.js';
import { MIN_PYTHON_VERSION } from '../defaults.js';

function commandExists(command: string): boolean {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(finder, [command], { stdio: 'pipe' });
  return result.status === 0;
}

function parseVersion(versionString: string): [number, number, number] {
  const trimmed = versionString.trim().replace(/^Python\s+/i, '');
  const [major = '0', minor = '0', patch = '0'] = trimmed.split('.');
  return [Number(major), Number(minor), Number(patch)];
}

function gteVersion(lhs: [number, number, number], rhs: [number, number, number]): boolean {
  if (lhs[0] !== rhs[0]) return lhs[0] > rhs[0];
  if (lhs[1] !== rhs[1]) return lhs[1] > rhs[1];
  return lhs[2] >= rhs[2];
}

export function checkPythonVersion(): { ok: boolean; version?: string } {
  if (!commandExists('python3')) {
    return { ok: false };
  }

  try {
    const version = execSync('python3 --version', { encoding: 'utf8' }).trim();
    const current = parseVersion(version);
    const min = parseVersion(MIN_PYTHON_VERSION);
    return { ok: gteVersion(current, min), version };
  } catch {
    return { ok: false };
  }
}

export function dependenciesReady(): boolean {
  return checkPythonVersion().ok && commandExists('uv');
}

function runInstall(command: string, cwd: string): void {
  execSync(command, {
    cwd,
    stdio: 'inherit',
    shell: '/bin/sh',
  });
}

export async function ensureBlopBootstrap(options: BootstrapOptions): Promise<void> {
  const spinner = clack.spinner();
  const { blopPath, skipPlaywright } = options;

  if (!checkPythonVersion().ok) {
    throw new Error(`Python ${MIN_PYTHON_VERSION}+ is required.`);
  }
  if (!commandExists('uv')) {
    throw new Error('uv is required. Install with: curl -LsSf https://astral.sh/uv/install.sh | sh');
  }

  spinner.start('Creating virtual environment...');
  runInstall('uv venv', blopPath);
  spinner.stop('Virtual environment ready');

  spinner.start('Installing blop package (editable)...');
  runInstall('uv pip install -e .', blopPath);
  spinner.stop('blop installed');

  if (!skipPlaywright) {
    spinner.start('Installing Playwright Chromium...');
    const playwrightCmd =
      process.platform === 'linux'
        ? 'playwright install chromium --with-deps --no-shell'
        : 'playwright install chromium --no-shell';
    runInstall(playwrightCmd, blopPath);
    spinner.stop('Playwright Chromium installed');
  }

  const venvBlopMcp = path.join(blopPath, '.venv', 'bin', 'blop-mcp');
  if (!commandExists('blop-mcp') && !commandExists(venvBlopMcp)) {
    clack.log.warn(
      'blop-mcp binary not found in PATH yet. This is usually fine when using uv --directory in MCP config.',
    );
  }
}

export function canUseClaudeCli(): boolean {
  return commandExists('claude');
}

export function runCommand(command: string): { ok: boolean; stdout: string; stderr: string } {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: '/bin/sh',
    });
    return { ok: true, stdout: output, stderr: '' };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    return {
      ok: false,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

