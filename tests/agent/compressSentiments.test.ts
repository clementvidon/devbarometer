import { describe, test, expect } from 'vitest';
import { compressSentiments } from '../../src/agent/compressSentiments';

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

      // Weighted average calculation:
      // joy: (0.8*10 + 0.4*20) / 30 = (8 + 8) / 30 = 16 / 30 ≈ 0.5333
      // sadness: (0.2*10 + 0.6*20) / 30 = (2 + 12) / 30 = 14 / 30 ≈ 0.4667

      expect(result.emotions.joy).toBeCloseTo(0.5333, 4);
      expect(result.emotions.sadness).toBeCloseTo(0.4667, 4);
    });

    test('returns zero emotions if no sentiments are provided', () => {
      const result = compressSentiments([]);
      expect(result.emotions).toEqual({});
    });
  });
});
