import { describe, expect, it } from 'vitest';
import {
  buildBootstrapPlan,
  getVenvBlopMcpPath,
  getVenvPythonPath,
} from './dependencies.js';

describe('dependencies bootstrap planning', () => {
  it('uses PyPI install command by default for pypi mode', () => {
    const plan = buildBootstrapPlan({
      installSource: 'pypi',
      runtimePath: '/tmp/blop-runtime',
      packageSpec: 'blop-mcp==0.4.0',
    });

    expect(plan.venvCwd).toBe('/tmp/blop-runtime');
    expect(plan.installCwd).toBe('/tmp/blop-runtime');
    expect(plan.pythonPath).toBe(getVenvPythonPath('/tmp/blop-runtime'));
    expect(plan.installCommand).toBe(
      `uv pip install --python "${getVenvPythonPath('/tmp/blop-runtime')}" "blop-mcp==0.4.0"`,
    );
    expect(plan.playwrightCommand).toContain('install chromium');
  });

  it('uses editable install for local mode', () => {
    const plan = buildBootstrapPlan({
      installSource: 'local',
      runtimePath: '/tmp/local-blop',
      localSourcePath: '/tmp/local-blop',
      skipPlaywright: true,
    });

    expect(plan.installCwd).toBe('/tmp/local-blop');
    expect(plan.installCommand).toBe(
      `uv pip install --python "${getVenvPythonPath('/tmp/local-blop')}" -e "/tmp/local-blop"`,
    );
    expect(plan.playwrightCommand).toBeUndefined();
  });

  it('resolves the venv entrypoint path for direct MCP launches', () => {
    expect(getVenvBlopMcpPath('/tmp/blop-runtime')).toBe(
      '/tmp/blop-runtime/.venv/bin/blop-mcp',
    );
  });
});
