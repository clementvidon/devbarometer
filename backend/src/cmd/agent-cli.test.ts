import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const captureSnapshotMock = vi.fn();
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

const exitSpy = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => undefined) as unknown as never);

vi.mock('../internal/adapter/driven/persistence/PostgresAdapter', () => ({
  PostgresAdapter: vi.fn(() => ({})),
}));
vi.mock('../infrastructure/fetch/NodeFetchAdapter', () => ({
  NodeFetchAdapter: vi.fn(() => ({})),
}));
vi.mock('../infrastructure/llm/OpenAIAdapter', () => ({
  OpenAIAdapter: vi.fn(() => ({})),
}));
vi.mock('../infrastructure/sources/RedditItemsAdapter', () => ({
  RedditItemsAdapter: vi.fn(() => ({})),
}));
vi.mock('../application/usecases/agent/makeReportingAgent', () => ({
  makeReportingAgent: vi.fn(() => ({
    captureSnapshot: captureSnapshotMock,
  })),
}));
vi.mock('openai', () => ({ default: vi.fn(() => ({})) }));

type Env = Record<string, string | undefined>;
let envBak: Env;

const cliUrl = new URL('./agent-cli.ts', import.meta.url);

function modulePath() {
  return cliUrl.pathname;
}
async function importReportingAgent(): Promise<void> {
  vi.resetModules();
  await import(cliUrl.href);
}

beforeEach(() => {
  envBak = { ...process.env };
  captureSnapshotMock.mockReset();
  errorSpy.mockClear();
  exitSpy.mockClear();

  if (typeof globalThis.fetch !== 'function') {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response('{}', { status: 200 })),
    ) as typeof fetch;
  }
});

afterEach(() => {
  process.env = envBak;
});

describe('agent-cli.ts entrypoint', () => {
  test('exits with 0 when captureSnapshot succeeds', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    process.argv[1] = modulePath();

    captureSnapshotMock.mockResolvedValue(undefined);

    await importReportingAgent();
    expect(captureSnapshotMock).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits with 1 when captureSnapshot rejects', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    process.argv[1] = modulePath();

    const boom = new Error('boom');
    captureSnapshotMock.mockRejectedValue(boom);

    await importReportingAgent();
    expect(captureSnapshotMock).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('ReportingAgent run failed:', boom);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
