import fs from 'fs';
import path from 'path';
import { runCommand } from './dependencies.js';
import { resolveRuntimePath } from './paths.js';
import { readEnvFile } from './config-write.js';
import type { DoctorOptions } from './types.js';
import { DEFAULT_BLOP_PACKAGE_NAME, DEFAULT_INSTALL_SOURCE } from './defaults.js';

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

  let runtimePath = '';
  try {
    const installSource = options.installSource ?? DEFAULT_INSTALL_SOURCE;
    const packageSpec = options.packageVersion
      ? `${options.packageName ?? DEFAULT_BLOP_PACKAGE_NAME}==${options.packageVersion}`
      : (options.packageName ?? DEFAULT_BLOP_PACKAGE_NAME);
    runtimePath = resolveRuntimePath({
      installSource,
      runtimePath: options.runtimePath,
      localSourcePath: options.blopPath,
    });
    rows.push({ label: 'runtime path resolved', ok: true, detail: runtimePath });
    rows.push({ label: 'install source', ok: true, detail: installSource });
    rows.push({ label: 'package spec', ok: true, detail: packageSpec });
  } catch (error) {
    rows.push({
      label: 'runtime path resolved',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  if (runtimePath) {
    const envPath = path.join(runtimePath, '.env');
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
      `uv --directory ${JSON.stringify(runtimePath)} run python -c "import blop.server; print('ok')"`,
    );
    rows.push({
      label: 'blop server import',
      ok: importCheck.ok && importCheck.stdout.includes('ok'),
      detail: importCheck.ok ? importCheck.stdout.trim() : importCheck.stderr.trim(),
    });

    const canonicalCheck = runCommand(
      `uv --directory ${JSON.stringify(runtimePath)} run python -c "from blop.server import validate_release_setup, discover_critical_journeys, run_release_check, triage_release_blocker; print('ok')"`,
    );
    rows.push({
      label: 'canonical MVP tools import',
      ok: canonicalCheck.ok && canonicalCheck.stdout.includes('ok'),
      detail: canonicalCheck.ok ? canonicalCheck.stdout.trim() : canonicalCheck.stderr.trim(),
    });
  }

  for (const row of rows) {
    const detail = row.detail ? ` (${row.detail})` : '';
    console.log(`${boolIcon(row.ok)} ${row.label}${options.verbose ? detail : ''}`);
  }

  return rows.every((row) => row.ok) ? 0 : 1;
}
