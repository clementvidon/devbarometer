import type { EmotionScores, TonalityScores } from '@devbarometer/shared';
import { describe, expect, test } from 'vitest';
import type { EmotionProfile, WeightedItem } from '../../entities';
import { attachWeightsToProfiles } from './attachWeightsToProfiles';

/**
 * Spec: Attach weights from items to their corresponding emotion profiles
 * - Throws if profiles and weightedItems length mismatch
 * - Throws if profiles and weightedItems order mismatch
 * - Fallbacks forces weight = 0
 */

describe(attachWeightsToProfiles.name, () => {
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
      positive: 0,
      negative: 0,
      positive_surprise: 0,
      negative_surprise: 0,
      optimistic_anticipation: 0,
      pessimistic_anticipation: 0,
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
  function makeWeightedItem(
    overrides: Partial<WeightedItem> = {},
  ): WeightedItem {
    return {
      itemRef: 'itemRef',
      title: 'title',
      content: 'content',
      score: 0,
      weight: 0,
      ...overrides,
    };
  }
  test('attach weights from items to their corresponding emotion profiles', () => {
    const profiles = [
      makeEmotionProfile({ itemRef: 'a' }),
      makeEmotionProfile({ itemRef: 'b' }),
      makeEmotionProfile({ itemRef: 'c' }),
    ];
    const weightedItems = [
      makeWeightedItem({ itemRef: 'a', weight: 1 }),
      makeWeightedItem({ itemRef: 'b', weight: 3 }),
      makeWeightedItem({ itemRef: 'c', weight: 2 }),
    ];

    const result = attachWeightsToProfiles(profiles, weightedItems);

    expect(result[0].weight).toBe(1);
    expect(result[1].weight).toBe(3);
    expect(result[2].weight).toBe(2);
  });
  test('throw if profiles and weightedItems length mismatch', () => {
    const profiles = [
      makeEmotionProfile({ itemRef: 'a' }),
      makeEmotionProfile({ itemRef: 'b' }),
      makeEmotionProfile({ itemRef: 'c' }),
    ];
    const weightedItems = [
      makeWeightedItem({ itemRef: 'a', weight: 1 }),
      makeWeightedItem({ itemRef: 'b', weight: 3 }),
    ];

    expect(() => attachWeightsToProfiles(profiles, weightedItems)).toThrow();
  });
  test('throws if profiles and weightedItems order mismatch', () => {
    const profiles = [
      makeEmotionProfile({ itemRef: 'a' }),
      makeEmotionProfile({ itemRef: 'b' }),
      makeEmotionProfile({ itemRef: 'c' }),
    ];
    const weightedItems = [
      makeWeightedItem({ itemRef: 'c', weight: 2 }),
      makeWeightedItem({ itemRef: 'b', weight: 3 }),
      makeWeightedItem({ itemRef: 'a', weight: 1 }),
    ];

    expect(() => attachWeightsToProfiles(profiles, weightedItems)).toThrow();
  });
  test('fallbacks forces weight = 0', () => {
    const profiles = [
      makeEmotionProfile({ itemRef: 'a', status: 'ok' }),
      makeEmotionProfile({ itemRef: 'b', status: 'fallback' }),
      makeEmotionProfile({ itemRef: 'c', status: 'ok' }),
    ];
    const weightedItems = [
      makeWeightedItem({ itemRef: 'a', weight: 1 }),
      makeWeightedItem({ itemRef: 'b', weight: 3 }),
      makeWeightedItem({ itemRef: 'c', weight: 2 }),
    ];

    const result = attachWeightsToProfiles(profiles, weightedItems);

    expect(result[0].weight).toBe(1);
    expect(result[1].weight).toBe(0);
    expect(result[2].weight).toBe(2);
  });
});
