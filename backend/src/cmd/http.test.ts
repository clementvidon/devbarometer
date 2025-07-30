import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type Mock,
} from 'vitest';

const listenMockImpl = (_port: number | string, cb?: () => void): void => {
  cb?.();
};
const listenMock: Mock = vi.fn(listenMockImpl);
const makeReportControllerMock: Mock = vi.fn(() => ({ listen: listenMock }));
const makeAgentServiceMock: Mock = vi.fn(() => ({ fake: 'agent' }));
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

vi.mock('../internal/core/service/makeAgentService.ts', () => ({
  makeAgentService: makeAgentServiceMock,
}));
vi.mock('../internal/adapter/driving/web/ReportController.ts', () => ({
  makeReportController: makeReportControllerMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.PORT = '1234';
});

afterEach(() => {
  vi.resetModules();
});

async function importHTTP() {
  vi.resetModules();
  await import('./http.ts');
}

describe('http.ts entrypoint', () => {
  test('starts the server on the provided port and logs the URL', async () => {
    await importHTTP();

    expect(makeAgentServiceMock).toHaveBeenCalled();
    expect(makeReportControllerMock).toHaveBeenCalledWith({ fake: 'agent' });
    expect(listenMock).toHaveBeenCalledWith('1234', expect.any(Function));
    expect(consoleLogSpy).toHaveBeenCalledWith('→ http://localhost:1234');
  });

  test('defaults to port 3000 if PORT is not defined', async () => {
    delete process.env.PORT;
    await importHTTP();

    expect(listenMock).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(consoleLogSpy).toHaveBeenCalledWith('→ http://localhost:3000');
  });
});
