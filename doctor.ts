import fs from 'fs';
import path from 'path';
import {
  getVenvBlopMcpPath,
  getVenvPythonPath,
  runCommand,
} from './dependencies.js';
import { resolveLocalSourcePath, resolveRuntimePath } from './paths.js';
import { readEnvFile } from './config-write.js';
import type { DoctorOptions, DoctorRow } from './types.js';
import {
  DEFAULT_BLOP_PACKAGE_NAME,
  DEFAULT_INSTALL_SOURCE,
} from './defaults.js';

function boolIcon(ok: boolean): string {
  return ok ? 'OK' : 'FAIL';
}

function getRequiredProviderKey(env: Partial<Record<string, string>>): {
  provider: string;
  keyName: string;
  configured: boolean;
} {
  const provider = (env.BLOP_LLM_PROVIDER ?? 'google').trim().toLowerCase();
  if (provider === 'anthropic') {
    return {
      provider,
      keyName: 'ANTHROPIC_API_KEY',
      configured: Boolean(env.ANTHROPIC_API_KEY),
    };
  }
  if (provider === 'openai') {
    return {
      provider,
      keyName: 'OPENAI_API_KEY',
      configured: Boolean(env.OPENAI_API_KEY),
    };
  }
  return {
    provider: 'google',
    keyName: 'GOOGLE_API_KEY',
    configured: Boolean(env.GOOGLE_API_KEY),
  };
}

export async function runDoctor(options: DoctorOptions = {}): Promise<number> {
  const rows = await collectDoctorRows(options);

  for (const row of rows) {
    const detail = row.detail ? ` (${row.detail})` : '';
    console.log(
      `${boolIcon(row.ok)} ${row.label}${options.verbose ? detail : ''}`,
    );
  }

  return rows.every((row) => row.ok) ? 0 : 1;
}

export async function collectDoctorRows(
  options: DoctorOptions = {},
): Promise<DoctorRow[]> {
  const rows: DoctorRow[] = [];

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
    const localSourcePath =
      installSource === 'local' ? resolveLocalSourcePath(options.blopPath) : '';
    runtimePath = resolveRuntimePath({
      installSource,
      runtimePath: options.runtimePath,
      localSourcePath,
    });
    rows.push({
      label: 'runtime path resolved',
      ok: true,
      detail: runtimePath,
    });
    rows.push({ label: 'install source', ok: true, detail: installSource });
    rows.push({ label: 'package spec', ok: true, detail: packageSpec });
    if (localSourcePath) {
      rows.push({
        label: 'local source path resolved',
        ok: true,
        detail: localSourcePath,
      });
    }
  } catch (error) {
    rows.push({
      label: 'runtime path resolved',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  if (runtimePath) {
    const envPath = path.join(runtimePath, '.env');
    const venvPython = getVenvPythonPath(runtimePath);
    const venvBlopMcp = getVenvBlopMcpPath(runtimePath);
    rows.push({
      label: '.env present',
      ok: fs.existsSync(envPath),
      detail: envPath,
    });
    rows.push({
      label: 'venv python present',
      ok: fs.existsSync(venvPython),
      detail: venvPython,
    });
    rows.push({
      label: 'blop-mcp entrypoint present',
      ok: fs.existsSync(venvBlopMcp),
      detail: venvBlopMcp,
    });

    const env = readEnvFile(envPath);
    const providerKey = getRequiredProviderKey(env);
    rows.push({
      label: 'LLM provider configured',
      ok: Boolean(providerKey.provider),
      detail: providerKey.provider,
    });
    rows.push({
      label: `${providerKey.keyName} configured`,
      ok: providerKey.configured,
    });
    rows.push({
      label: 'production env posture',
      ok:
        env.BLOP_ENV === 'production' &&
        env.BLOP_REQUIRE_ABSOLUTE_PATHS === 'true' &&
        Boolean(env.BLOP_DB_PATH && path.isAbsolute(env.BLOP_DB_PATH)) &&
        Boolean(env.BLOP_RUNS_DIR && path.isAbsolute(env.BLOP_RUNS_DIR)) &&
        Boolean(env.BLOP_DEBUG_LOG && path.isAbsolute(env.BLOP_DEBUG_LOG)) &&
        env.BLOP_CAPABILITIES_PROFILE === 'production_minimal' &&
        env.BLOP_ENABLE_COMPAT_TOOLS === 'false' &&
        env.BLOP_ALLOW_INTERNAL_URLS === 'false' &&
        env.BLOP_RUN_TIMEOUT_SECS === '1800' &&
        env.BLOP_STEP_TIMEOUT_SECS === '45' &&
        env.BLOP_MAX_CONCURRENT_RUNS === '10' &&
        env.BLOP_ALLOW_SCREENSHOT_LLM === 'false',
      detail:
        `BLOP_ENV=${env.BLOP_ENV ?? ''} DB=${env.BLOP_DB_PATH ?? ''} RUNS=${env.BLOP_RUNS_DIR ?? ''} ` +
        `LOG=${env.BLOP_DEBUG_LOG ?? ''} CAPS=${env.BLOP_CAPABILITIES_PROFILE ?? ''} ` +
        `COMPAT=${env.BLOP_ENABLE_COMPAT_TOOLS ?? ''} INTERNAL=${env.BLOP_ALLOW_INTERNAL_URLS ?? ''} ` +
        `RUN_TIMEOUT=${env.BLOP_RUN_TIMEOUT_SECS ?? ''} STEP_TIMEOUT=${env.BLOP_STEP_TIMEOUT_SECS ?? ''} ` +
        `MAX_CONCURRENT=${env.BLOP_MAX_CONCURRENT_RUNS ?? ''} SCREENSHOT_LLM=${env.BLOP_ALLOW_SCREENSHOT_LLM ?? ''}`,
    });

    const importCheck = runCommand(
      `${JSON.stringify(venvPython)} -c "import blop.server; print('ok')"`,
    );
    rows.push({
      label: 'blop server import',
      ok: importCheck.ok && importCheck.stdout.includes('ok'),
      detail: importCheck.ok
        ? importCheck.stdout.trim()
        : importCheck.stderr.trim(),
    });

    const canonicalCheck = runCommand(
      `${JSON.stringify(venvPython)} -c "from blop.server import validate_release_setup, discover_critical_journeys, run_release_check, triage_release_blocker; print('ok')"`,
    );
    rows.push({
      label: 'canonical MVP tools import',
      ok: canonicalCheck.ok && canonicalCheck.stdout.includes('ok'),
      detail: canonicalCheck.ok
        ? canonicalCheck.stdout.trim()
        : canonicalCheck.stderr.trim(),
    });

    const entrypointCheck = runCommand(`${JSON.stringify(venvBlopMcp)} --help`);
    rows.push({
      label: 'blop-mcp entrypoint runnable',
      ok: entrypointCheck.ok,
      detail: entrypointCheck.ok
        ? entrypointCheck.stdout.trim()
        : entrypointCheck.stderr.trim(),
    });
  }
  return rows;
}
