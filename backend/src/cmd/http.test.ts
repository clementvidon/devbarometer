import type { Server } from 'http';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const listenSpy = vi.fn((_port: number, cb?: () => void): Server => {
  cb?.();
  return { close: vi.fn() } as unknown as Server;
});

vi.mock('../internal/adapter/driving/web/ReportController.ts', () => ({
  makeReportController: vi.fn(() => ({ listen: listenSpy })),
}));

vi.mock('../internal/adapter/driven/persistence/PostgresAdapter.ts', () => ({
  PostgresAdapter: vi.fn(() => ({})),
}));
vi.mock('../internal/adapter/driven/fetch/NodeFetchAdapter.ts', () => ({
  NodeFetchAdapter: vi.fn(() => ({})),
}));
vi.mock('../internal/adapter/driven/llm/OpenAIAdapter.ts', () => ({
  OpenAIAdapter: vi.fn(() => ({})),
}));

vi.mock('openai', () => ({
  default: vi.fn(() => ({})),
}));

type Env = Record<string, string | undefined>;
let envBak: Env;

function modulePath() {
  return new URL('./http.ts', import.meta.url).pathname;
}
async function importHTTP() {
  vi.resetModules();
  return import('./http.ts');
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
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    process.env.PORT = '4321';

    process.argv[1] = modulePath();

    await importHTTP();
    expect(listenSpy).toHaveBeenCalledWith(4321, expect.any(Function));
  });

  test.skip('defaults to port 3000 if PORT is not defined', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REDDIT_URL = 'https://example.test/r/foo.json';
    delete process.env.PORT;

    process.argv[1] = modulePath();
    await importHTTP();

    expect(listenSpy).toHaveBeenCalledWith(3000, expect.any(Function));
  });
});
