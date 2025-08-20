import * as fs from 'fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AgentService } from '../internal/core/service/AgentService.ts';
import * as agentModule from '../internal/core/service/makeCoreAgentService.ts';
import { generateStatic } from './generate-static.ts';

vi.mock('fs');

describe('generateStatic', () => {
  const mockWrite = vi.mocked(fs.writeFileSync);

  beforeEach(() => {
    vi.clearAllMocks();

    const mockAgent = {
      getLastEmotionProfileReport: vi
        .fn()
        .mockResolvedValue({ text: 'report', emoji: '☀️' }),
      getLastTopHeadlines: vi.fn().mockResolvedValue(['Item A', 'Item B']),
      getAggregatedEmotionProfiles: vi
        .fn()
        .mockResolvedValue([{ createdAt: '2025-08-03', aggregate: {} }]),
    };

    vi.spyOn(agentModule, 'makeCoreAgentService').mockImplementation(
      () => mockAgent as unknown as AgentService,
    );
  });

  test('writes report and headlines to disk', async () => {
    await generateStatic();

    expect(mockWrite).toHaveBeenCalledWith(
      expect.stringContaining('report.json'),
      JSON.stringify({ text: 'report', emoji: '☀️' }, null, 2),
      'utf-8',
    );

    expect(mockWrite).toHaveBeenCalledWith(
      expect.stringContaining('ticker.json'),
      JSON.stringify(['Item A', 'Item B'], null, 2),
      'utf-8',
    );

    expect(mockWrite).toHaveBeenCalledWith(
      expect.stringContaining('chart.json'),
      JSON.stringify([{ createdAt: '2025-08-03', aggregate: {} }], null, 2),
      'utf-8',
    );
  });
});
