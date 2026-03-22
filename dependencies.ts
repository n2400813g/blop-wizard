import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import clack from './clack.js';
import type { BootstrapOptions } from './types.js';
import { MIN_PYTHON_VERSION } from './defaults.js';

export function commandExists(command: string): boolean {
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

function quoteShellArg(value: string): string {
  return JSON.stringify(value);
}

export function getVenvBinDir(runtimePath: string): string {
  return path.join(path.resolve(runtimePath), '.venv', process.platform === 'win32' ? 'Scripts' : 'bin');
}

export function getVenvPythonPath(runtimePath: string): string {
  return path.join(getVenvBinDir(runtimePath), process.platform === 'win32' ? 'python.exe' : 'python');
}

export function getVenvBlopMcpPath(runtimePath: string): string {
  return path.join(getVenvBinDir(runtimePath), process.platform === 'win32' ? 'blop-mcp.exe' : 'blop-mcp');
}

export function getVenvPlaywrightPath(runtimePath: string): string {
  return path.join(getVenvBinDir(runtimePath), process.platform === 'win32' ? 'playwright.exe' : 'playwright');
}

export function buildBootstrapPlan(options: BootstrapOptions): {
  venvCwd: string;
  installCwd: string;
  installCommand: string;
  pythonPath: string;
  playwrightCommand?: string;
} {
  const { runtimePath, localSourcePath, installSource, packageSpec, skipPlaywright } = options;
  const pythonPath = getVenvPythonPath(runtimePath);
  const installCommand =
    installSource === 'local'
      ? `uv pip install --python ${quoteShellArg(pythonPath)} -e ${quoteShellArg(path.resolve(localSourcePath ?? runtimePath))}`
      : `uv pip install --python ${quoteShellArg(pythonPath)} ${quoteShellArg(packageSpec ?? 'blop-mcp')}`;
  const installCwd = runtimePath;
  const playwrightCommand = skipPlaywright
    ? undefined
    : process.platform === 'linux'
      ? `${quoteShellArg(getVenvPlaywrightPath(runtimePath))} install chromium --with-deps --no-shell`
      : `${quoteShellArg(getVenvPlaywrightPath(runtimePath))} install chromium --no-shell`;

  return {
    venvCwd: runtimePath,
    installCwd,
    installCommand,
    pythonPath,
    playwrightCommand,
  };
}

export async function ensureBlopBootstrap(options: BootstrapOptions): Promise<void> {
  const spinner = clack.spinner();
  const { runtimePath, installSource, reinstall } = options;
  fs.mkdirSync(runtimePath, { recursive: true });
  const plan = buildBootstrapPlan(options);

  if (!checkPythonVersion().ok) {
    throw new Error(`Python ${MIN_PYTHON_VERSION}+ is required.`);
  }
  if (!commandExists('uv')) {
    throw new Error('uv is required. Install with: curl -LsSf https://astral.sh/uv/install.sh | sh');
  }

  if (reinstall && fs.existsSync(path.dirname(plan.pythonPath))) {
    spinner.start('Recreating virtual environment...');
    fs.rmSync(path.dirname(plan.pythonPath), { recursive: true, force: true });
    spinner.stop('Previous virtual environment removed');
  }

  if (fs.existsSync(plan.pythonPath)) {
    clack.log.step(`Reusing existing virtual environment at ${path.dirname(plan.pythonPath)}`);
  } else {
    spinner.start('Creating virtual environment...');
    runInstall('uv venv', plan.venvCwd);
    spinner.stop('Virtual environment ready');
  }

  spinner.start(
    installSource === 'local' ? 'Installing blop package (editable)...' : 'Installing blop package from PyPI...',
  );
  runInstall(plan.installCommand, plan.installCwd);
  spinner.stop('blop installed');

  if (plan.playwrightCommand) {
    spinner.start('Installing Playwright Chromium...');
    runInstall(plan.playwrightCommand, runtimePath);
    spinner.stop('Playwright Chromium installed');
  }

  const venvBlopMcp = getVenvBlopMcpPath(runtimePath);
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
