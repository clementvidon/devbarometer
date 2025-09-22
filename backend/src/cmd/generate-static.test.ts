import * as fs from 'fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Agent } from '../internal/core/service/Agent.ts';
import * as agentModule from '../internal/core/service/makeCoreAgent.ts';
import { generateStatic } from './generate-static.ts';

vi.mock('fs');

describe('generateStatic', () => {
  const mockWrite = vi.mocked(fs.writeFileSync);

  beforeEach(() => {
    vi.clearAllMocks();

    const mockAgent = {
      getLastReport: vi.fn().mockResolvedValue({ text: 'report', emoji: '☀️' }),
      getLastTopHeadlines: vi.fn().mockResolvedValue(['Item A', 'Item B']),
      getAggregatedProfiles: vi
        .fn()
        .mockResolvedValue([{ createdAt: '2025-08-03', aggregate: {} }]),
    };

    vi.spyOn(agentModule, 'makeCoreAgent').mockImplementation(
      () => mockAgent as unknown as Agent,
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
