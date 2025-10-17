import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const captureSnapshotMock = vi.fn();
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

const exitSpy = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => undefined) as unknown as never);

vi.mock('../infrastructure/persistence/PostgresAdapter', () => ({
  PostgresAdapter: vi.fn(() => ({})),
}));
vi.mock('../infrastructure/fetch/NodeFetchAdapter', () => ({
  NodeFetchAdapter: vi.fn(() => ({})),
}));
vi.mock('../infrastructure/llm/OpenAIAdapter', () => ({
  OpenAIAdapter: vi.fn(() => ({})),
}));
vi.mock('../infrastructure/items/RedditItemsAdapter', () => ({
  RedditItemsAdapter: vi.fn(() => ({})),
}));
vi.mock('../application/usecases/agent/makeReportingAgentService', () => ({
  makeReportingAgentService: vi.fn(() => ({
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

let argvBak: string[];

beforeEach(() => {
  envBak = { ...process.env };
  argvBak = [...process.argv];
  process.argv[1] = modulePath();
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
  process.argv = argvBak;
});

describe('agent-cli.ts entrypoint', () => {
  test('exits with 0 when captureSnapshot succeeds', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    process.env.REDDIT_CLIENT_ID = 'id';
    process.env.REDDIT_CLIENT_SECRET = 'secret';
    process.env.REDDIT_USERNAME = 'user';
    process.env.REDDIT_PASSWORD = 'pass';

    captureSnapshotMock.mockResolvedValue(undefined);

    await importReportingAgent();
    expect(captureSnapshotMock).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits with 1 when captureSnapshot rejects', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    process.env.REDDIT_CLIENT_ID = 'id';
    process.env.REDDIT_CLIENT_SECRET = 'secret';
    process.env.REDDIT_USERNAME = 'user';
    process.env.REDDIT_PASSWORD = 'pass';

    process.argv[1] = modulePath();

    const boom = new Error('boom');
    captureSnapshotMock.mockRejectedValue(boom);

    await importReportingAgent();
    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'ReportingAgentService run failed:',
        boom,
      );
    });

    expect(errorSpy).toHaveBeenCalledWith(
      'ReportingAgentService run failed:',
      boom,
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
