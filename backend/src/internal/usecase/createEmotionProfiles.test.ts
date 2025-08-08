import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { EmotionProfile } from '../core/entity/EmotionProfile.ts';
import type { Post } from '../core/entity/Post.ts';
import { createEmotionProfiles } from './createEmotionProfiles.ts';

const fakeEmotions = {
  joy: 0,
  sadness: 0,
  anger: 0,
  fear: 0,
  trust: 0,
  disgust: 0,
} as const;

const fakeTonalities = {
  positive: 0,
  negative: 0,
  optimistic_anticipation: 0,
  pessimistic_anticipation: 0,
  positive_surprise: 0,
  negative_surprise: 0,
} as const;

const fakePosts: Post[] = [
  {
    id: 'idA',
    title: 'Post A',
    content: 'Great job market',
    upvotes: 15,
  },
  {
    id: 'idB',
    title: 'Post B',
    content: 'Not sure about this',
    upvotes: 7,
  },
];

const fakeEmotionProfile: EmotionProfile = {
  title: 'dummy',
  source: 'dummy',
  weight: 0,
  emotions: fakeEmotions,
  tonalities: fakeTonalities,
};

describe('createEmotionProfiles', () => {
  describe('Happy path', () => {
    let llm: { run: Mock };

    beforeEach(() => {
      vi.clearAllMocks();
      llm = {
        run: vi
          .fn()
          .mockResolvedValue(JSON.stringify(fakeEmotionProfile.emotions)),
      };
    });

    test('analyzes data points and returns emotionProfile results', async () => {
      const emotionProfiles = await createEmotionProfiles(fakePosts, llm);

      expect(emotionProfiles).toHaveLength(2);
      emotionProfiles.forEach((res, index) => {
        expect(res.title).toBe(fakePosts[index].title);
        expect(res.source).toBe(fakePosts[index].id);
        expect(res.weight).toBe(fakePosts[index].upvotes);
        expect(res.emotions).toEqual(fakeEmotionProfile.emotions);
        expect(res.tonalities).toEqual(fakeEmotionProfile.tonalities);
      });
    });

    describe('Error handling', () => {
      let llm: { run: Mock };

      beforeEach(() => {
        vi.clearAllMocks();
        llm = {
          run: vi.fn(),
        };
      });

      test('returns fallback emotions if LLM call fails', async () => {
        llm.run.mockRejectedValue(new Error('LLM Failure'));
        const emotionProfiles = await createEmotionProfiles(fakePosts, llm);

        expect(emotionProfiles).toHaveLength(2);
        emotionProfiles.forEach((res, index) => {
          expect(res.title).toBe(fakePosts[index].title);
          expect(res.source).toBe(fakePosts[index].id);
          expect(res.weight).toBe(fakePosts[index].upvotes);
          expect(Object.values(res.emotions)).toSatisfy((values: number[]) =>
            values.every((v) => v === 0),
          );
          expect(Object.values(res.tonalities)).toSatisfy((values: number[]) =>
            values.every((v) => v === 0),
          );
        });
      });
    });
  });
});
