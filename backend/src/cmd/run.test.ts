import type { Mock } from 'vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../internal/adapter/driven/fetch/NodeFetchAdapter', () => ({
  NodeFetchAdapter: vi.fn(),
}));
vi.mock('../internal/adapter/driven/llm/OpenAiAdapter', () => ({
  OpenAiAdapter: vi.fn(),
}));
vi.mock('../internal/adapter/driven/persistence/LowdbAdapter', () => ({
  LowdbAdapter: vi.fn(),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({})),
}));

let runMock: Mock = vi.fn();
vi.mock('../internal/core/service/AgentService', () => ({
  AgentService: vi.fn(() => ({ run: runMock })),
}));

const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const exitSpy = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as (code?: string | number | null) => never);

async function importCLI() {
  vi.resetModules();
  await import('./run.ts');
}

afterEach(() => vi.clearAllMocks());

describe('run.ts entrypoint', () => {
  describe('Happy path', () => {
    test('logs the report and does not exit', async () => {
      runMock = vi.fn().mockResolvedValue('Report OK');
      await importCLI();

      expect(runMock).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Report OK');
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('logs the error and exits with code 1', async () => {
      const boom = new Error('Boom');
      runMock = vi.fn().mockRejectedValue(boom);
      await importCLI();

      expect(errSpy).toHaveBeenCalledWith('Agent run failed:', boom);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
