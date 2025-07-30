import { describe, expect, test, vi } from 'vitest';
import { AgentService } from './AgentService.ts';
import { makeAgentService } from './makeAgentService.ts';

vi.mock('../../adapter/driven/fetch/NodeFetchAdapter', () => ({
  NodeFetchAdapter: vi.fn().mockImplementation(() => ({
    fetch: vi.fn(),
  })),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../adapter/driven/llm/OpenAiAdapter', () => ({
  OpenAiAdapter: vi.fn().mockImplementation(() => ({
    run: vi.fn(),
  })),
}));

vi.mock('../../adapter/driven/persistence/PostgresAdapter', () => ({
  PostgresAdapter: vi.fn().mockImplementation(() => ({
    storeSnapshot: vi.fn(),
    getSnapshots: vi.fn(),
  })),
}));

describe('makeAgentService', () => {
  test('returns an instance of AgentService', () => {
    const agent = makeAgentService();
    expect(agent).toBeInstanceOf(AgentService);
  });
});
