import { describe, expect, test } from 'vitest';

import { RELEVANCE_CALIBRATION_FIXTURES } from './relevanceCalibration.fixture';

describe('RELEVANCE_CALIBRATION_FIXTURES', () => {
  test('contains 15 unique cases', () => {
    expect(RELEVANCE_CALIBRATION_FIXTURES).toHaveLength(15);
    expect(
      new Set(RELEVANCE_CALIBRATION_FIXTURES.map((item) => item.itemRef)).size,
    ).toBe(15);
  });

  test('covers the 3 target buckets', () => {
    expect(
      new Set(
        RELEVANCE_CALIBRATION_FIXTURES.map((item) => item.expectedCategory),
      ),
    ).toEqual(new Set(['emotional_insight', 'factual_insight', 'noise']));
  });
});
