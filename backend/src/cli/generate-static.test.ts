import * as fs from 'fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { generateStatic } from './generate-static';

vi.mock('fs');

describe('generateStatic', () => {
  const mockWrite = vi.mocked(fs.writeFileSync);

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mock('../application/usecases/queries/getTopHeadlines', () => ({
      getTopHeadlines: () => ['Item A', 'Item B'],
    }));
    vi.mock('../application/usecases/queries/getLastReport', () => ({
      getLastReport: () => ({ text: 'report', emoji: '☀️ ' }),
    }));
    vi.mock('../application/usecases/queries/getAggregatedProfiles', () => ({
      getAggregatedProfiles: () => [{ createdAt: '2025-08-03', aggregate: {} }],
    }));
  });

  test('writes report and headlines to disk', async () => {
    await generateStatic();

    expect(mockWrite).toHaveBeenCalledTimes(3);
    const calls = vi.mocked(fs.writeFileSync).mock.calls;

    expect(calls[0][0]).toEqual(expect.stringContaining('report.json'));
    expect(JSON.parse(calls[0][1] as string)).toEqual({
      text: 'report',
      emoji: '☀️ ',
    });
    expect(calls[0][2]).toBe('utf-8');

    expect(calls[1][0]).toEqual(expect.stringContaining('ticker.json'));
    expect(JSON.parse(calls[1][1] as string)).toEqual(['Item A', 'Item B']);
    expect(calls[1][2]).toBe('utf-8');

    expect(calls[2][0]).toEqual(expect.stringContaining('chart.json'));
    expect(JSON.parse(calls[2][1] as string)).toEqual([
      { createdAt: '2025-08-03', aggregate: {} },
    ]);
    expect(calls[2][2]).toBe('utf-8');
  });
});
