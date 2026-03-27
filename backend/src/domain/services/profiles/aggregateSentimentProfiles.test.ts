import type { EmotionScores, TonalityScores } from '@masswhisper/shared/domain';
import { describe, expect, test } from 'vitest';

import type { WeightedSentimentProfile } from '../../entities';
import { aggregateSentimentProfiles } from './aggregateSentimentProfiles';

/**
 * Spec: Aggregate a list of sentiment profiles into a weighted-average aggregated profile.
 * - Computes `count` and `confidenceMass`.
 * - Computes weighted averages for emotions and tonalities when `confidenceMass > 0`.
 * - Returns all-zero scores when `confidenceMass === 0`.
 * - Throws on empty input.
 */

describe('aggregateSentimentProfiles', () => {
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
  function makeWeightedSentimentProfile(
    overrides: Partial<WeightedSentimentProfile> = {},
  ): WeightedSentimentProfile {
    return {
      itemRef: 'itemRef',
      emotions: makeEmotionScores(),
      tonalities: makeTonalityScores(),
      status: 'ok',
      weight: 0,
      ...overrides,
    };
  }
  test('aggregate a list of sentiment profiles whose total weight is > 0', () => {
    const profiles: WeightedSentimentProfile[] = [
      makeWeightedSentimentProfile({
        emotions: makeEmotionScores({ joy: 0 }),
        tonalities: makeTonalityScores({ positive_surprise: 0.5 }),
        weight: 3,
      }),
      makeWeightedSentimentProfile({
        emotions: makeEmotionScores({ joy: 1 }),
        tonalities: makeTonalityScores({ positive_surprise: 0.5 }),
        weight: 1,
      }),
    ];

    const result = aggregateSentimentProfiles(profiles);

    expect(result.count).toBe(2);
    expect(result.confidenceMass).toBe(4);
    expect(result.emotions.joy).toBeCloseTo(0.25);
    expect(result.tonalities.positive_surprise).toBeCloseTo(0.5);
  });
  test('aggregate a list of sentiment profiles whose total weight is 0', () => {
    const profiles: WeightedSentimentProfile[] = [
      makeWeightedSentimentProfile({
        emotions: makeEmotionScores({ joy: 0 }),
        tonalities: makeTonalityScores({ positive_surprise: 0.5 }),
        weight: 0,
      }),
      makeWeightedSentimentProfile({
        emotions: makeEmotionScores({ joy: 1 }),
        tonalities: makeTonalityScores({ positive_surprise: 0.5 }),
        weight: 0,
      }),
    ];

    const result = aggregateSentimentProfiles(profiles);

    expect(result.count).toBe(2);
    expect(result.confidenceMass).toBe(0);
    expect(result.emotions.joy).toBe(0);
    expect(result.tonalities.positive_surprise).toBe(0);
  });
  test('throw if input is empty', () => {
    const profiles: WeightedSentimentProfile[] = [];

    expect(() => {
      aggregateSentimentProfiles(profiles);
    }).toThrow();
  });
});
