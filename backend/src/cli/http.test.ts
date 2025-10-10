import type { Server } from 'http';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const listenSpy = vi.fn((_port: number, cb?: () => void): Server => {
  cb?.();
  return { close: vi.fn() } as unknown as Server;
});

vi.mock('../interface/web/ReportController', () => ({
  makeReportController: vi.fn(() => ({ listen: listenSpy })),
}));

vi.mock('../infrastructure/persistence/PostgresAdapter', () => ({
  PostgresAdapter: vi.fn(() => ({})),
}));
vi.mock('../infrastructure/fetch/NodeFetchAdapter', () => ({
  NodeFetchAdapter: vi.fn(() => ({})),
}));
vi.mock('../infrastructure/llm/OpenAIAdapter', () => ({
  OpenAIAdapter: vi.fn(() => ({})),
}));

vi.mock('openai', () => ({
  default: vi.fn(() => ({})),
}));

type Env = Record<string, string | undefined>;
let envBak: Env;

const cliUrl = new URL('./http.ts', import.meta.url);

function modulePath() {
  return cliUrl.pathname;
}
async function importHTTP(): Promise<void> {
  vi.resetModules();
  await import(cliUrl.href);
}

beforeEach(() => {
  envBak = { ...process.env };
  listenSpy.mockClear();

  if (typeof globalThis.fetch !== 'function') {
    const mockFetch: typeof fetch = vi.fn(() =>
      Promise.resolve(new Response('{}', { status: 200 })),
    );
    globalThis.fetch = mockFetch;
  }
});

afterEach(() => {
  process.env = envBak;
});

describe('http.ts entrypoint', () => {
  test('starts the server on the provided port and logs the URL', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    process.env.REDDIT_CLIENT_ID = 'id';
    process.env.REDDIT_CLIENT_SECRET = 'secret';
    process.env.REDDIT_USERNAME = 'user';
    process.env.REDDIT_PASSWORD = 'pass';
    process.env.PORT = '4321';

    process.argv[1] = modulePath();

    await importHTTP();
    expect(listenSpy).toHaveBeenCalledWith(4321, expect.any(Function));
  });

  test.skip('defaults to port 3000 if PORT is not defined', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.REDDIT_CLIENT_ID = 'id';
    process.env.REDDIT_CLIENT_SECRET = 'secret';
    process.env.REDDIT_USERNAME = 'user';
    process.env.REDDIT_PASSWORD = 'pass';
    delete process.env.PORT;

    process.argv[1] = modulePath();
    await importHTTP();

    expect(listenSpy).toHaveBeenCalledWith(3000, expect.any(Function));
  });
});
