import { describe, test, expect } from 'vitest';
import { compressSentiments } from './compressSentiments';

describe('compressSentiments', () => {
  describe('Happy path', () => {
    test('calculates weighted averages correctly', () => {
      const sentiments = [
        {
          upvotes: 10,
          emotions: {
            joy: 0.8,
            sadness: 0.2,
          },
        },
        {
          upvotes: 20,
          emotions: {
            joy: 0.4,
            sadness: 0.6,
          },
        },
      ];
      const result = compressSentiments(sentiments);

      expect(result.emotions.joy).toBeCloseTo(0.5333, 4);
      expect(result.emotions.sadness).toBeCloseTo(0.4667, 4);
      expect(typeof result.timestamp).toBe('string');
      expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
    });
  });
  describe('Error handling', () => {
    test('throws if no sentiments are provided', () => {
      expect(() => compressSentiments([])).toThrow(/No sentiments to compress/);
    });
  });
});
