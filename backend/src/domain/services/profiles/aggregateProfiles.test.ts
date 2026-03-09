import { describe, expect, test } from 'vitest';
import type {
  EmotionProfile,
  EmotionScores,
  TonalityScores,
  WeightedEmotionProfile,
} from '../../entities';
import { aggregateProfiles } from './aggregateProfiles';

/**
 * Spec: Aggregate a list of emotion profiles into a weighted-average aggregated profile.
 * - Computes `count` and `totalWeight`.
 * - Computes weighted averages for emotions and tonalities when `totalWeight > 0`.
 * - Returns all-zero scores when `totalWeight === 0`.
 * - Throws on empty input.
 */

describe(aggregateProfiles.name, () => {
  function makeEmotionScores(
    overrides: Partial<EmotionScores> = {},
  ): EmotionScores {
    return {
      joy: 0,
      trust: 0,
      anger: 0,
      fear: 0,
      sadness: 0,
      disgust: 0,
      ...overrides,
    };
  }
  function makeTonalityScores(
    overrides: Partial<TonalityScores> = {},
  ): TonalityScores {
    return {
      positive: 1,
      negative: 1,
      positive_surprise: 1,
      negative_surprise: 1,
      optimistic_anticipation: 1,
      pessimistic_anticipation: 1,
      ...overrides,
    };
  }
  function makeEmotionProfile(
    overrides: Partial<EmotionProfile> = {},
  ): EmotionProfile {
    return {
      itemRef: 'itemRef',
      emotions: makeEmotionScores(),
      tonalities: makeTonalityScores(),
      status: 'ok',
      ...overrides,
    };
  }
  function makeWeightedEmotionProfile(
    overrides: Partial<WeightedEmotionProfile> = {},
  ): WeightedEmotionProfile {
    return {
      profile: makeEmotionProfile(),
      weight: 0,
      ...overrides,
    };
  }
  test('aggregate a list of emotion profiles whose total weight is > 0', () => {
    const profiles: WeightedEmotionProfile[] = [
      makeWeightedEmotionProfile({
        profile: makeEmotionProfile({
          emotions: makeEmotionScores({ joy: 0 }),
          tonalities: makeTonalityScores({ positive_surprise: 0.5 }),
        }),
        weight: 3,
      }),
      makeWeightedEmotionProfile({
        profile: makeEmotionProfile({
          emotions: makeEmotionScores({ joy: 1 }),
          tonalities: makeTonalityScores({ positive_surprise: 0.5 }),
        }),
        weight: 1,
      }),
    ];

    const result = aggregateProfiles(profiles);

    expect(result.count).toBe(2);
    expect(result.totalWeight).toBe(4);
    expect(result.emotions.joy).toBeCloseTo(0.25);
    expect(result.tonalities.positive_surprise).toBeCloseTo(0.5);
  });
  test('aggregate a list of emotion profiles whose total weight is 0', () => {
    const profiles: WeightedEmotionProfile[] = [
      makeWeightedEmotionProfile({
        profile: makeEmotionProfile({
          emotions: makeEmotionScores({ joy: 0 }),
          tonalities: makeTonalityScores({ positive_surprise: 0.5 }),
        }),
        weight: 0,
      }),
      makeWeightedEmotionProfile({
        profile: makeEmotionProfile({
          emotions: makeEmotionScores({ joy: 1 }),
          tonalities: makeTonalityScores({ positive_surprise: 0.5 }),
        }),
        weight: 0,
      }),
    ];

    const result = aggregateProfiles(profiles);

    expect(result.count).toBe(2);
    expect(result.totalWeight).toBe(0);
    expect(result.emotions.joy).toBe(0);
    expect(result.tonalities.positive_surprise).toBe(0);
  });
  test('throw if input is empty', () => {
    const profiles: WeightedEmotionProfile[] = [];

    expect(() => {
      aggregateProfiles(profiles);
    }).toThrow();
  });
});
