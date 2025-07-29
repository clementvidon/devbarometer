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

let updateReportMock: Mock = vi.fn();
vi.mock('../internal/core/service/AgentService', () => ({
  AgentService: vi.fn(() => ({ updateReport: updateReportMock })),
}));

const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const exitSpy = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as (code?: string | number | null) => never);

async function importCLI() {
  vi.resetModules();
  await import('./cli.ts');
}

afterEach(() => vi.clearAllMocks());

describe('cli.ts entrypoint', () => {
  describe('Happy path', () => {
    test('logs the report and does not exit', async () => {
      await importCLI();

      expect(updateReportMock).toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('logs the error and exits with code 1', async () => {
      const boom = new Error('Boom');
      updateReportMock.mockRejectedValue(boom);
      await importCLI();

      expect(errSpy).toHaveBeenCalledWith('Agent run failed:', boom);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
