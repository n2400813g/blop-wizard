import { describe, expect, it } from 'vitest';
import { buildBootstrapPlan } from './dependencies.js';

describe('dependencies bootstrap planning', () => {
  it('uses PyPI install command by default for pypi mode', () => {
    const plan = buildBootstrapPlan({
      installSource: 'pypi',
      runtimePath: '/tmp/blop-runtime',
      packageSpec: 'blop==0.4.0',
    });

    expect(plan.venvCwd).toBe('/tmp/blop-runtime');
    expect(plan.installCwd).toBe('/tmp/blop-runtime');
    expect(plan.installCommand).toBe('uv pip install "blop==0.4.0"');
    expect(plan.playwrightCommand).toContain('playwright install chromium');
  });

  it('uses editable install for local mode', () => {
    const plan = buildBootstrapPlan({
      installSource: 'local',
      runtimePath: '/tmp/local-blop',
      localSourcePath: '/tmp/local-blop',
      skipPlaywright: true,
    });

    expect(plan.installCwd).toBe('/tmp/local-blop');
    expect(plan.installCommand).toBe('uv pip install -e .');
    expect(plan.playwrightCommand).toBeUndefined();
  });
});
