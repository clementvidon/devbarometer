import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { EmotionProfile, WeightedItem } from '../../../domain/entities';
import { NoopLoggerAdapter } from '../../../infrastructure/logging/NoopLoggerAdapter';
import type { LlmMessage } from '../../ports/output/LlmPort';
import { createProfiles } from './createProfiles';

type RunFn = (
  model: string,
  messages: readonly LlmMessage[],
  options?: unknown,
) => Promise<string>;

const fakeEmotions = {
  joy: 0.2,
  sadness: 0.1,
  anger: 0.05,
  fear: 0.15,
  trust: 0.3,
  disgust: 0.2,
} as const;

const fakeTonalities = {
  positive: 0.6,
  negative: 0.2,
  optimistic_anticipation: 0.4,
  pessimistic_anticipation: 0.1,
  positive_surprise: 0.25,
  negative_surprise: 0.05,
} as const;

const fakeWeightedItems: WeightedItem[] = [
  {
    source: 'source A',
    title: 'Item A',
    content: 'Great job market',
    score: 15,
    weight: 15,
  },
  {
    source: 'source B',
    title: 'Item B',
    content: 'Not sure about this',
    score: 7,
    weight: 7,
  },
];

const fakeEmotionProfile: EmotionProfile = {
  title: 'dummy',
  source: 'dummy',
  weight: 0,
  emotions: fakeEmotions,
  tonalities: fakeTonalities,
};

describe('createProfiles', () => {
  describe('Happy path', () => {
    let llm: { run: RunFn };

    beforeEach(() => {
      vi.clearAllMocks();

      llm = {
        run: vi.fn<RunFn>().mockImplementation((_model, messages) => {
          const first = messages[0];
          const content =
            typeof first.content === 'string' ? first.content : '';

          if (content.includes('"joy"') && content.includes('"disgust"')) {
            return Promise.resolve(JSON.stringify(fakeEmotionProfile.emotions));
          }

          if (
            content.includes('"positive"') &&
            content.includes('"pessimistic_anticipation"')
          ) {
            return Promise.resolve(
              JSON.stringify(fakeEmotionProfile.tonalities),
            );
          }

          return Promise.reject(new Error('Unexpected LLM prompt'));
        }),
      };
    });

    test('analyzes data points and returns emotionProfile results', async () => {
      const emotionProfiles = await createProfiles(
        new NoopLoggerAdapter(),
        fakeWeightedItems,
        llm,
      );

      expect(emotionProfiles).toHaveLength(2);
      emotionProfiles.forEach((res, index) => {
        expect(res.source).toBe(fakeWeightedItems[index].source);
        expect(res.title).toBe(fakeWeightedItems[index].title);
        expect(res.weight).toBe(fakeWeightedItems[index].weight);
        expect(res.emotions).toEqual(fakeEmotionProfile.emotions);
        expect(res.tonalities).toEqual(fakeEmotionProfile.tonalities);
      });
    });
  });

  describe('Error handling (solution A)', () => {
    let llm: { run: RunFn };

    beforeEach(() => {
      vi.clearAllMocks();

      llm = {
        run: vi.fn<RunFn>(() => Promise.reject(new Error('LLM Failure'))),
      };
    });

    test('returns fallback emotions/tonalities and sets weight to 0 when LLM fails', async () => {
      const emotionProfiles = await createProfiles(
        new NoopLoggerAdapter(),
        fakeWeightedItems,
        llm,
      );

      expect(emotionProfiles).toHaveLength(2);
      emotionProfiles.forEach((res, index) => {
        expect(res.source).toBe(fakeWeightedItems[index].source);
        expect(res.title).toBe(fakeWeightedItems[index].title);
        expect(res.weight).toBe(0);
        expect(
          Object.values(res.emotions as Record<string, number>).every(
            (v) => v === 0,
          ),
        ).toBe(true);
        expect(
          Object.values(res.tonalities as Record<string, number>).every(
            (v) => v === 0,
          ),
        ).toBe(true);
      });
    });
  });
});
