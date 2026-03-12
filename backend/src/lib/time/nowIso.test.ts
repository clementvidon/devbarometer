import { describe, expect, test, vi } from 'vitest';

import { nowIso } from './nowIso';

/**
 * Spec: Return the current time as an ISO string.
 * - Uses system time (Date) as the source of truth.
 */

describe(nowIso.name, () => {
  test('returns current date in ISO format', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));

    const result = nowIso();

    expect(result).toBe('2020-01-01T00:00:00.000Z');

    vi.useRealTimers();
  });
});
