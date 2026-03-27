import fs from 'fs';
import os from 'os';
import path from 'path';

function hasBlopSourceMarkers(targetPath: string): boolean {
  const pyproject = path.join(targetPath, 'pyproject.toml');
  const envExample = path.join(targetPath, '.env.example');
  const srcServer = path.join(targetPath, 'src', 'blop', 'server.py');
  return (
    fs.existsSync(pyproject) &&
    fs.existsSync(envExample) &&
    fs.existsSync(srcServer)
  );
}

export function resolveLocalSourcePath(providedPath?: string): string {
  const fromArg = providedPath ? path.resolve(providedPath) : undefined;
  if (fromArg && hasBlopSourceMarkers(fromArg)) {
    return fromArg;
  }

  const fromEnv = process.env.BLOP_USE_PATH
    ? path.resolve(process.env.BLOP_USE_PATH)
    : undefined;
  if (fromEnv && hasBlopSourceMarkers(fromEnv)) {
    return fromEnv;
  }

  const cwd = process.cwd();
  if (hasBlopSourceMarkers(cwd)) {
    return cwd;
  }

  const siblingBlopMcp = path.resolve(cwd, '..', 'blop-mcp');
  if (hasBlopSourceMarkers(siblingBlopMcp)) {
    return siblingBlopMcp;
  }

  const siblingBlopUse = path.resolve(cwd, '..', 'blop-use');
  if (hasBlopSourceMarkers(siblingBlopUse)) {
    return siblingBlopUse;
  }

  throw new Error(
    'Could not locate local blop source. Pass --blop-path /absolute/path/to/blop-mcp or set BLOP_USE_PATH.',
  );
}

export function resolveRuntimePath(options: {
  installSource: 'pypi' | 'local';
  runtimePath?: string;
  localSourcePath?: string;
}): string {
  if (options.runtimePath) {
    return path.resolve(options.runtimePath);
  }
  if (process.env.BLOP_RUNTIME_PATH) {
    return path.resolve(process.env.BLOP_RUNTIME_PATH);
  }
  return path.join(os.homedir(), '.blop-mcp');
}

export function resolveProjectPath(providedPath?: string): string {
  return path.resolve(providedPath ?? process.cwd());
}

export function assertLocalBlopSourcePath(blopPath: string): void {
  const resolved = path.resolve(blopPath);
  if (!hasBlopSourceMarkers(resolved)) {
    throw new Error(`Invalid local blop source path: ${resolved}`);
  }
}
