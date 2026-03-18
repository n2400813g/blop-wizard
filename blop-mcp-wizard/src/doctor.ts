import fs from 'fs';
import path from 'path';
import { runCommand } from './utils/dependencies.js';
import { resolveBlopPath } from './utils/paths.js';
import { readEnvFile } from './utils/config-write.js';
import type { DoctorOptions } from './utils/types.js';

function boolIcon(ok: boolean): string {
  return ok ? 'OK' : 'FAIL';
}

export async function runDoctor(options: DoctorOptions = {}): Promise<number> {
  const rows: Array<{ label: string; ok: boolean; detail?: string }> = [];

  const py = runCommand('python3 --version');
  rows.push({
    label: 'python3 available',
    ok: py.ok,
    detail: py.ok ? py.stdout.trim() : py.stderr.trim(),
  });

  const uv = runCommand('uv --version');
  rows.push({
    label: 'uv available',
    ok: uv.ok,
    detail: uv.ok ? uv.stdout.trim() : uv.stderr.trim(),
  });

  let blopPath = '';
  try {
    blopPath = resolveBlopPath(options.blopPath);
    rows.push({ label: 'blop-use path resolved', ok: true, detail: blopPath });
  } catch (error) {
    rows.push({
      label: 'blop-use path resolved',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  if (blopPath) {
    const envPath = path.join(blopPath, '.env');
    rows.push({
      label: '.env present',
      ok: fs.existsSync(envPath),
      detail: envPath,
    });

    const env = readEnvFile(envPath);
    rows.push({
      label: 'GOOGLE_API_KEY configured',
      ok: Boolean(env.GOOGLE_API_KEY),
    });

    const importCheck = runCommand(
      `uv --directory ${JSON.stringify(blopPath)} run python -c "import blop.server; print('ok')"`,
    );
    rows.push({
      label: 'blop server import',
      ok: importCheck.ok && importCheck.stdout.includes('ok'),
      detail: importCheck.ok ? importCheck.stdout.trim() : importCheck.stderr.trim(),
    });
  }

  for (const row of rows) {
    const detail = row.detail ? ` (${row.detail})` : '';
    console.log(`${boolIcon(row.ok)} ${row.label}${options.verbose ? detail : ''}`);
  }

  return rows.every((row) => row.ok) ? 0 : 1;
}

