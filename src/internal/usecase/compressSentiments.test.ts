import { describe, test, expect } from 'vitest';
import { compressSentiments } from './compressSentiments';
import type { Sentiment } from '../core/entity/Sentiment';

const fakeSentiments: Sentiment[] = [
  {
    postId: '1',
    title: 'Post 1',
    upvotes: 10,
    emotions: {
      anger: 0,
      fear: 0,
      anticipation: 0,
      trust: 0,
      surprise: 0,
      sadness: 0.2,
      joy: 0.8,
      disgust: 0,
      negative: 0,
      positive: 0,
    },
  },
  {
    postId: '2',
    title: 'Post 2',
    upvotes: 20,
    emotions: {
      anger: 0.1,
      fear: 0.2,
      anticipation: 0.3,
      trust: 0.4,
      surprise: 0.5,
      sadness: 0.1,
      joy: 0.6,
      disgust: 0.05,
      negative: 0.15,
      positive: 0.85,
    },
  },
];

describe('compressSentiments', () => {
  describe('Happy path', () => {
    test('calculates weighted averages correctly', () => {
      const result = compressSentiments(fakeSentiments);

      expect(result.emotions.joy).toBeCloseTo(0.6667, 4);
      expect(result.emotions.sadness).toBeCloseTo(0.1333, 4);
      expect(typeof result.timestamp).toBe('string');
      expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
    });
  });

  describe('Error handling', () => {
    test('returns empty average if no sentiments are provided', () => {
      const result = compressSentiments([]);

      expect(Object.values(result.emotions).every((v) => v === 0)).toBe(true);
      expect(typeof result.timestamp).toBe('string');
      expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
      expect(Object.keys(result.emotions).sort()).toEqual(
        [
          'anger',
          'anticipation',
          'disgust',
          'fear',
          'joy',
          'negative',
          'positive',
          'sadness',
          'surprise',
          'trust',
        ].sort(),
      );
    });
  });
});
