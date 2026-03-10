import type { EmotionScores, TonalityScores } from '@devbarometer/shared';
import { describe, expect, test } from 'vitest';
import type { SentimentProfile, WeightedItem } from '../../entities';
import { attachWeightsToSentimentProfiles } from './attachWeightsToSentimentProfiles';

/**
 * Spec: Attach weights from items to their corresponding sentiment profiles
 * - Throws if profiles and weightedItems length mismatch
 * - Throws if profiles and weightedItems order mismatch
 * - Fallbacks forces weight = 0
 */

describe(attachWeightsToSentimentProfiles.name, () => {
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
  function makeSentimentProfile(
    overrides: Partial<SentimentProfile> = {},
  ): SentimentProfile {
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
  test('attach weights from items to their corresponding sentiment profiles', () => {
    const profiles = [
      makeSentimentProfile({ itemRef: 'a' }),
      makeSentimentProfile({ itemRef: 'b' }),
      makeSentimentProfile({ itemRef: 'c' }),
    ];
    const weightedItems = [
      makeWeightedItem({ itemRef: 'a', weight: 1 }),
      makeWeightedItem({ itemRef: 'b', weight: 3 }),
      makeWeightedItem({ itemRef: 'c', weight: 2 }),
    ];

    const result = attachWeightsToSentimentProfiles(profiles, weightedItems);

    result.forEach((profile, i) => {
      expect(profile).toStrictEqual({
        weight: weightedItems[i].weight,
        itemRef: profiles[i].itemRef,
        emotions: makeEmotionScores(),
        tonalities: makeTonalityScores(),
        status: profiles[i].status,
      });
    });
  });
  test('throw if profiles and weightedItems length mismatch', () => {
    const profiles = [
      makeSentimentProfile({ itemRef: 'a' }),
      makeSentimentProfile({ itemRef: 'b' }),
      makeSentimentProfile({ itemRef: 'c' }),
    ];
    const weightedItems = [
      makeWeightedItem({ itemRef: 'a', weight: 1 }),
      makeWeightedItem({ itemRef: 'b', weight: 3 }),
    ];

    expect(() =>
      attachWeightsToSentimentProfiles(profiles, weightedItems),
    ).toThrow();
  });
  test('throws if profiles and weightedItems order mismatch', () => {
    const profiles = [
      makeSentimentProfile({ itemRef: 'a' }),
      makeSentimentProfile({ itemRef: 'b' }),
      makeSentimentProfile({ itemRef: 'c' }),
    ];
    const weightedItems = [
      makeWeightedItem({ itemRef: 'c', weight: 2 }),
      makeWeightedItem({ itemRef: 'b', weight: 3 }),
      makeWeightedItem({ itemRef: 'a', weight: 1 }),
    ];

    expect(() =>
      attachWeightsToSentimentProfiles(profiles, weightedItems),
    ).toThrow();
  });
  test('fallbacks forces weight = 0', () => {
    const profiles = [
      makeSentimentProfile({ itemRef: 'a', status: 'ok' }),
      makeSentimentProfile({ itemRef: 'b', status: 'fallback' }),
      makeSentimentProfile({ itemRef: 'c', status: 'ok' }),
    ];
    const weightedItems = [
      makeWeightedItem({ itemRef: 'a', weight: 1 }),
      makeWeightedItem({ itemRef: 'b', weight: 3 }),
      makeWeightedItem({ itemRef: 'c', weight: 2 }),
    ];

    const result = attachWeightsToSentimentProfiles(profiles, weightedItems);

    result.forEach((profile, i) => {
      expect(profile).toStrictEqual({
        weight: profiles[i].status == 'ok' ? weightedItems[i].weight : 0,
        itemRef: profiles[i].itemRef,
        emotions: makeEmotionScores(),
        tonalities: makeTonalityScores(),
        status: profiles[i].status,
      });
    });
  });
});
