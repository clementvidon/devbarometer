import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { filterRelevantPosts } from './filterRelevantPosts';

const fakePosts = [
  {
    title: 'Relevant Post A',
    content: 'Insightful',
    topComment: 'Top comment',
    upvotes: 10,
  },
  {
    title: 'Relevant Post B',
    content: 'Insightful',
    topComment: 'Top comment',
    upvotes: 5,
  },
  {
    title: 'Irrelevant Post',
    content: 'Off-topic',
    topComment: 'Top comment',
    upvotes: 20,
  },
];

describe('filterRelevantPosts', () => {
  describe('Happy path', () => {
    let llm: { run: Mock };

    beforeEach(() => {
      vi.clearAllMocks();
      llm = {
        run: vi.fn(async (_model, messages) => {
          const content = messages[1].content;
          if (content.includes('Relevant')) {
            return '{ "relevant": true }';
          }
          return '{ "relevant": false }';
        }),
      };
    });

    test.only('filters relevant data points correctly', async () => {
      const relevantPosts = await filterRelevantPosts(fakePosts, llm);

      expect(relevantPosts).toHaveLength(2);
      expect(relevantPosts.map((post) => post.title)).toEqual([
        'Relevant Post A',
        'Relevant Post B',
      ]);
    });
  });
});
