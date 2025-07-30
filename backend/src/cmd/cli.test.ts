import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type Mock,
} from 'vitest';

let updateReportMock: Mock = vi.fn();

vi.mock('../internal/core/service/makeAgentService.ts', () => ({
  makeAgentService: vi.fn(() => ({
    updateReport: updateReportMock,
  })),
}));

const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((
  code?: number,
) => {
  throw new Error(`process.exit: ${code}`);
}) as never);

const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

async function importCLI() {
  vi.resetModules();
  return import('./cli.ts');
}

beforeEach(() => {
  vi.clearAllMocks();
  updateReportMock = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('cli.ts entrypoint', () => {
  test('calls updateReport once and does NOT exit (happy path)', async () => {
    updateReportMock.mockResolvedValue(undefined);

    await importCLI();

    expect(updateReportMock).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('logs the error and exits with code 1 when updateReport rejects', async () => {
    const boom = new Error('Boom');
    updateReportMock.mockRejectedValue(boom);

    try {
      await importCLI();
    } catch (err) {
      expect(err).toEqual(new Error('process.exit: 1'));
    }

    expect(updateReportMock).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Agent run failed:', boom);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
