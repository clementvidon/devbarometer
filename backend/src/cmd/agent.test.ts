import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type Mock,
} from 'vitest';

const updateReportMock: Mock = vi.fn();

vi.mock('../internal/core/service/makeCoreAgentService.ts', () => ({
  makeCoreAgentService: vi.fn(() => ({
    updateReport: updateReportMock,
  })),
}));

const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((
  code?: number,
) => {
  throw new Error(`process.exit: ${code}`);
}) as never);

const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

async function importAgent() {
  vi.resetModules();
  return import('./agent.ts');
}

beforeEach(() => {
  vi.clearAllMocks();
  updateReportMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('agent.ts entrypoint', () => {
  test('logs the error and exits with code 1 when updateReport rejects', async () => {
    const boom = new Error('Boom');
    updateReportMock.mockRejectedValue(boom);

    try {
      await importAgent();
    } catch (err) {
      expect(err).toEqual(new Error('process.exit: 1'));
    }

    expect(updateReportMock).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Agent run failed:', boom);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
