import { describe, expect, test } from 'vitest';
import type {
  EmotionProfile,
  EmotionScores,
  TonalityScores,
} from '../../entities';
import { aggregateProfiles } from './aggregateProfiles';

/**
 * Spec: Aggregate a list of emotion profiles into a single averaged profile
 *
 * Inputs:
 * - a list of emotion profiles
 *
 * Output:
 * - an aggregated emotion profile containing:
 *  - the number of profiles it aggregated
 *  - the average emotions and tonalities
 *  - the total weight across all profiles
 *
 * Throws:
 * - if input is empty
 *
 * Behavior:
 * - compute total weight of all input profiles
 * - compute weighted average emotions
 * - compute weighted average tonalities
 * - return the aggregate emotion profile
 *
 * Invariants:
 * - weight >= 0
 */

type EmotionProfileOverrides = {
  title: string;
  source: string;
  weight: number;
  emotions: Partial<EmotionScores>;
  tonalities: Partial<TonalityScores>;
};

function makeEmotionProfile(
  overrides: Partial<EmotionProfileOverrides> = {},
): EmotionProfile {
  const defaults: EmotionProfile = {
    title: 'title',
    source: 'source',
    weight: 0,
    emotions: {
      joy: 1,
      trust: 1,
      anger: 1,
      fear: 1,
      sadness: 1,
      disgust: 1,
    },
    tonalities: {
      positive: 1,
      negative: 1,
      positive_surprise: 1,
      negative_surprise: 1,
      optimistic_anticipation: 1,
      pessimistic_anticipation: 1,
    },
  };
  return {
    ...defaults,
    ...overrides,
    emotions: {
      ...defaults.emotions,
      ...overrides.emotions,
    },
    tonalities: {
      ...defaults.tonalities,
      ...overrides.tonalities,
    },
  };
}

describe('aggregateProfiles', () => {
  test('aggregate a list of emotion profiles whose total weight is > 0', () => {
    const profiles: EmotionProfile[] = [
      makeEmotionProfile({
        weight: 3,
        emotions: { joy: 0 },
        tonalities: { positive_surprise: 0.5 },
      }),
      makeEmotionProfile({
        weight: 1,
        emotions: { joy: 1 },
        tonalities: { positive_surprise: 0.5 },
      }),
    ];

    const result = aggregateProfiles(profiles);

    expect(result.count).toBe(2);
    expect(result.totalWeight).toBe(4);
    expect(result.emotions.joy).toBeCloseTo(0.25);
    expect(result.tonalities.positive_surprise).toBeCloseTo(0.5);
  });
  test('aggregate a list of emotion profiles whose total weight is 0', () => {
    const profiles: EmotionProfile[] = [
      makeEmotionProfile({
        weight: 0,
        emotions: { joy: 0 },
        tonalities: { positive_surprise: 0.5 },
      }),
      makeEmotionProfile({
        weight: 0,
        emotions: { joy: 1 },
        tonalities: { positive_surprise: 0.5 },
      }),
    ];

    const result = aggregateProfiles(profiles);

    expect(result.count).toBe(2);
    expect(result.totalWeight).toBe(0);
    expect(result.emotions.joy).toBe(0);
    expect(result.tonalities.positive_surprise).toBe(0);
  });
  test('throw if input is empty', () => {
    const profiles: EmotionProfile[] = [];

    expect(() => {
      aggregateProfiles(profiles);
    }).toThrow();
  });
});
