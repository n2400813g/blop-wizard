import fs from 'fs';
import path from 'path';

function hasBlopMarkers(targetPath: string): boolean {
  const pyproject = path.join(targetPath, 'pyproject.toml');
  const envExample = path.join(targetPath, '.env.example');
  const srcServer = path.join(targetPath, 'src', 'blop', 'server.py');
  return fs.existsSync(pyproject) && fs.existsSync(envExample) && fs.existsSync(srcServer);
}

export function resolveBlopPath(providedPath?: string): string {
  const fromArg = providedPath ? path.resolve(providedPath) : undefined;
  if (fromArg && hasBlopMarkers(fromArg)) {
    return fromArg;
  }

  const fromEnv = process.env.BLOP_USE_PATH ? path.resolve(process.env.BLOP_USE_PATH) : undefined;
  if (fromEnv && hasBlopMarkers(fromEnv)) {
    return fromEnv;
  }

  const cwd = process.cwd();
  if (hasBlopMarkers(cwd)) {
    return cwd;
  }

  const sibling = path.resolve(cwd, '..', 'blop-use');
  if (hasBlopMarkers(sibling)) {
    return sibling;
  }

  throw new Error(
    'Could not locate blop-use. Pass --blop-path /absolute/path/to/blop-use or set BLOP_USE_PATH.',
  );
}

export function assertBlopPath(blopPath: string): void {
  const resolved = path.resolve(blopPath);
  if (!hasBlopMarkers(resolved)) {
    throw new Error(`Invalid blop-use path: ${resolved}`);
  }
}

