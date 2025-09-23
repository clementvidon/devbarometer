import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const updateReportMock = vi.fn();
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

const exitSpy = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => undefined) as unknown as never);

vi.mock('../internal/adapter/driven/persistence/PostgresAdapter.ts', () => ({
  PostgresAdapter: vi.fn(() => ({})),
}));
vi.mock('../internal/adapter/driven/fetch/NodeFetchAdapter.ts', () => ({
  NodeFetchAdapter: vi.fn(() => ({})),
}));
vi.mock('../internal/adapter/driven/llm/OpenAIAdapter.ts', () => ({
  OpenAIAdapter: vi.fn(() => ({})),
}));
vi.mock('../internal/adapter/driven/items/RedditItemsAdapter.ts', () => ({
  RedditItemsAdapter: vi.fn(() => ({})),
}));
vi.mock('../internal/core/service/makeCoreAgent.ts', () => ({
  makeCoreAgent: vi.fn(() => ({ updateReport: updateReportMock })),
}));
vi.mock('openai', () => ({ default: vi.fn(() => ({})) }));

type Env = Record<string, string | undefined>;
let envBak: Env;

function modulePath() {
  return new URL('./agent.ts', import.meta.url).pathname;
}
async function importAgent() {
  vi.resetModules();
  return import('./agent.ts');
}

beforeEach(() => {
  envBak = { ...process.env };
  updateReportMock.mockReset();
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

describe('agent.ts entrypoint', () => {
  test('exits with 0 when updateReport succeeds', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    process.argv[1] = modulePath();

    updateReportMock.mockResolvedValue(undefined);

    await importAgent();
    expect(updateReportMock).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits with 1 when updateReport rejects', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    process.argv[1] = modulePath();

    const boom = new Error('boom');
    updateReportMock.mockRejectedValue(boom);

    await importAgent();
    expect(updateReportMock).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Agent run failed:', boom);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
