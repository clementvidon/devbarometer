import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { analyzeSentiments } from './analyzeSentiments';
import type { Post } from '../core/entity/Post';
import type { Sentiment } from '../core/entity/Sentiment';

const fakePosts: Post[] = [
  {
    id: 'idA',
    title: 'Post A',
    content: 'Great job market',
    topComment: 'I agree',
    upvotes: 15,
  },
  {
    id: 'idB',
    title: 'Post B',
    content: 'Not sure about this',
    topComment: 'Interesting',
    upvotes: 7,
  },
];

const fakeSentiment: Sentiment = {
  postId: 'dummy',
  title: 'dummy',
  upvotes: 0,
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
};

describe('analyzeSentiments', () => {
  describe('Happy path', () => {
    let llm: { run: Mock };

    beforeEach(() => {
      vi.clearAllMocks();
      llm = {
        run: vi.fn().mockResolvedValue(JSON.stringify(fakeSentiment.emotions)),
      };
    });

    test('analyzes data points and returns sentiment results', async () => {
      const sentiments = await analyzeSentiments(fakePosts, llm);

      expect(sentiments).toHaveLength(2);
      sentiments.forEach((res, index) => {
        expect(res.postId).toBe(fakePosts[index].id);
        expect(res.title).toBe(fakePosts[index].title);
        expect(res.upvotes).toBe(fakePosts[index].upvotes);
        expect(res.emotions).toEqual(fakeSentiment.emotions);
      });
    });
  });
});
