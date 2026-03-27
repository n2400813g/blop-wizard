import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  confirmMock,
  selectMock,
  outroMock,
  printWelcomeMock,
  printRestartHintMock,
  collectDoctorRowsMock,
  bootstrapBlopMock,
  addMCPServerToClientsStepMock,
} = vi.hoisted(() => ({
  confirmMock: vi.fn(),
  selectMock: vi.fn(),
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
    select: selectMock,
    outro: outroMock,
    log: {
      step: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
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

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(
      (target: string) => target === '/runtime' || target === '/runtime/.venv',
    ),
  },
}));

import { runUpgrade } from './upgrade.js';

describe('upgrade flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upgrades in place by default in ci mode', async () => {
    collectDoctorRowsMock.mockResolvedValue([
      { label: 'python3 available', ok: true },
    ]);
    bootstrapBlopMock.mockResolvedValue({
      env: { GOOGLE_API_KEY: 'test-key' },
    });
    addMCPServerToClientsStepMock.mockResolvedValue(['Cursor (project)']);

    const code = await runUpgrade({ ci: true, packageVersion: '0.3.0' });

    expect(code).toBe(0);
    expect(bootstrapBlopMock).toHaveBeenCalledWith(
      expect.objectContaining({
        packageSpec: 'blop-mcp==0.3.0',
        reinstall: false,
      }),
    );
    expect(outroMock).toHaveBeenCalledWith(expect.stringContaining('upgraded'));
  });

  it('passes reinstall through to bootstrap when requested', async () => {
    collectDoctorRowsMock
      .mockResolvedValueOnce([{ label: 'venv python present', ok: false }])
      .mockResolvedValueOnce([{ label: 'venv python present', ok: true }]);
    bootstrapBlopMock.mockResolvedValue({
      env: { GOOGLE_API_KEY: 'test-key' },
    });
    addMCPServerToClientsStepMock.mockResolvedValue([]);

    const code = await runUpgrade({ ci: true, reinstall: true });

    expect(code).toBe(0);
    expect(bootstrapBlopMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reinstall: true,
      }),
    );
    expect(outroMock).toHaveBeenCalledWith(
      expect.stringContaining('reinstalled'),
    );
  });

  it('returns a failing exit code when checks still fail after upgrade', async () => {
    collectDoctorRowsMock
      .mockResolvedValueOnce([{ label: 'blop server import', ok: false }])
      .mockResolvedValueOnce([
        {
          label: 'blop server import',
          ok: false,
          detail: 'ModuleNotFoundError',
        },
      ]);
    bootstrapBlopMock.mockResolvedValue({
      env: { GOOGLE_API_KEY: 'test-key' },
    });
    addMCPServerToClientsStepMock.mockResolvedValue([]);

    const code = await runUpgrade({ ci: true });

    expect(code).toBe(1);
    expect(outroMock).toHaveBeenCalledWith(
      expect.stringContaining('still need attention'),
    );
  });
});
