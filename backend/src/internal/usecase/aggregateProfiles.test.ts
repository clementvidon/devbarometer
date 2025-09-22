import { describe, expect, test } from 'vitest';
import type { EmotionProfile } from '../core/entity/EmotionProfile.ts';
import { aggregateProfiles } from './aggregateProfiles.ts';

const fakeEmotionProfiles: EmotionProfile[] = [
  {
    title: 'Item 1',
    source: '1',
    weight: 10,
    emotions: {
      anger: 0.8,
      fear: 0.7,
      trust: 0.6,
      sadness: 0.5,
      joy: 0.4,
      disgust: 0.3,
    },
    tonalities: {
      positive: 0.2,
      negative: 0.3,
      optimistic_anticipation: 0.4,
      pessimistic_anticipation: 0.5,
      positive_surprise: 0.6,
      negative_surprise: 0.7,
    },
  },
  {
    title: 'Item 2',
    source: '2',
    weight: 20,
    emotions: {
      anger: 0.6,
      fear: 0.5,
      trust: 0.4,
      sadness: 0.3,
      joy: 0.2,
      disgust: 0.1,
    },
    tonalities: {
      positive: 0.1,
      negative: 0.2,
      optimistic_anticipation: 0.3,
      pessimistic_anticipation: 0.4,
      positive_surprise: 0.5,
      negative_surprise: 0.6,
    },
  },
];

describe('aggregateProfiles', () => {
  describe('Happy path', () => {
    test('calculates weighted averages correctly', () => {
      const result = aggregateProfiles(fakeEmotionProfiles);

      expect(result.emotions.anger).toBeCloseTo(0.6667, 4);
      expect(result.tonalities.positive).toBeCloseTo(0.1333, 4);
    });
  });

  describe('Error handling', () => {
    test('returns empty average if no emotionProfiles are provided', () => {
      const result = aggregateProfiles([]);

      expect(Object.values(result.emotions).every((v) => v === 0)).toBe(true);
      expect(Object.values(result.tonalities).every((v) => v === 0)).toBe(true);
      expect(Object.keys(result.emotions).sort()).toEqual(
        ['anger', 'disgust', 'fear', 'joy', 'sadness', 'trust'].sort(),
      );
      expect(Object.keys(result.tonalities).sort()).toEqual(
        [
          'positive',
          'negative',
          'optimistic_anticipation',
          'pessimistic_anticipation',
          'positive_surprise',
          'negative_surprise',
        ].sort(),
      );
    });
  });
});
