import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  confirmMock,
  outroMock,
  printWelcomeMock,
  printRestartHintMock,
  collectDoctorRowsMock,
  bootstrapBlopMock,
  addMCPServerToClientsStepMock,
} = vi.hoisted(() => ({
  confirmMock: vi.fn(),
  outroMock: vi.fn(),
  printWelcomeMock: vi.fn(),
  printRestartHintMock: vi.fn(),
  collectDoctorRowsMock: vi.fn(),
  bootstrapBlopMock: vi.fn(),
  addMCPServerToClientsStepMock: vi.fn(),
}));

vi.mock('./clack.js', () => ({
  default: {
    confirm: confirmMock,
    outro: outroMock,
    log: {
      step: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  },
}));

vi.mock('./clack-utils.js', () => ({
  abortIfCancelled: async <T>(value: Promise<T> | T) => await value,
  printRestartHint: printRestartHintMock,
  printWelcome: printWelcomeMock,
}));

vi.mock('./paths.js', () => ({
  resolveLocalSourcePath: vi.fn((value?: string) => value ?? '/local-source'),
  resolveProjectPath: vi.fn((value?: string) => value ?? '/project'),
  resolveRuntimePath: vi.fn(() => '/runtime'),
}));

vi.mock('./bootstrap-blop.js', () => ({
  bootstrapBlop: bootstrapBlopMock,
}));

vi.mock('./add-mcp-server-to-clients.js', () => ({
  addMCPServerToClientsStep: addMCPServerToClientsStepMock,
}));

vi.mock('./doctor.js', () => ({
  collectDoctorRows: collectDoctorRowsMock,
}));

import { runRepair } from './repair.js';

describe('repair flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips repair work when doctor finds no issues', async () => {
    collectDoctorRowsMock.mockResolvedValue([{ label: 'python3 available', ok: true }]);

    const code = await runRepair({ ci: true });

    expect(code).toBe(0);
    expect(bootstrapBlopMock).not.toHaveBeenCalled();
    expect(addMCPServerToClientsStepMock).not.toHaveBeenCalled();
    expect(outroMock).toHaveBeenCalledWith(expect.stringContaining('No repair needed'));
  });

  it('repairs the runtime and reconfigures clients when diagnosis fails', async () => {
    collectDoctorRowsMock
      .mockResolvedValueOnce([{ label: 'blop server import', ok: false, detail: 'ModuleNotFoundError' }])
      .mockResolvedValueOnce([{ label: 'blop server import', ok: true }]);
    bootstrapBlopMock.mockResolvedValue({
      env: {
        GOOGLE_API_KEY: 'test-key',
      },
    });
    addMCPServerToClientsStepMock.mockResolvedValue(['Cursor (project)']);

    const code = await runRepair({ ci: true, targets: ['cursor'] });

    expect(code).toBe(0);
    expect(bootstrapBlopMock).toHaveBeenCalledWith(expect.objectContaining({
      ci: true,
      installSource: 'pypi',
      packageSpec: 'blop-mcp',
      runtimePath: '/runtime',
    }));
    expect(addMCPServerToClientsStepMock).toHaveBeenCalledWith(expect.objectContaining({
      ci: true,
      projectPath: '/project',
      runtimePath: '/runtime',
      targets: ['cursor'],
    }));
    expect(printRestartHintMock).toHaveBeenCalled();
    expect(outroMock).toHaveBeenCalledWith(expect.stringContaining('repaired'));
  });

  it('returns a failing exit code when issues remain after repair', async () => {
    collectDoctorRowsMock
      .mockResolvedValueOnce([{ label: 'blop-mcp entrypoint runnable', ok: false }])
      .mockResolvedValueOnce([{ label: 'blop-mcp entrypoint runnable', ok: false, detail: 'permission denied' }]);
    bootstrapBlopMock.mockResolvedValue({
      env: {
        GOOGLE_API_KEY: 'test-key',
      },
    });
    addMCPServerToClientsStepMock.mockResolvedValue([]);

    const code = await runRepair({ ci: true });

    expect(code).toBe(1);
    expect(outroMock).toHaveBeenCalledWith(expect.stringContaining('still need attention'));
  });
});
