import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Post } from '../core/entity/Post.ts';
import { filterRelevantPosts } from './filterRelevantPosts.ts';

const fakePosts: Post[] = [
  {
    id: 'a1',
    title: 'Relevant Post A',
    content: 'Insightful',
    topComment: 'Top comment',
    upvotes: 10,
  },
  {
    id: 'b2',
    title: 'Relevant Post B',
    content: 'Insightful',
    topComment: 'Top comment',
    upvotes: 5,
  },
  {
    id: 'c3',
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
      type LocalMsg = { role: 'system' | 'user'; content: string };
      llm = {
        run: vi.fn(
          (_model: string, _temperature: number, messages: LocalMsg[]) => {
            const content = messages[1].content;
            return content.includes('Relevant')
              ? '{ "relevant": true }'
              : '{ "relevant": false }';
          },
        ),
      };
    });

    test('filters relevant data points correctly', async () => {
      const relevantPosts = await filterRelevantPosts(fakePosts, llm);

      expect(relevantPosts).toHaveLength(2);
      expect(relevantPosts.map((p) => p.title)).toEqual([
        'Relevant Post A',
        'Relevant Post B',
      ]);
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

    test('returns [] if LLM fails', async () => {
      llm.run.mockRejectedValue(new Error('LLM failure'));
      const relevantPosts = await filterRelevantPosts(fakePosts, llm);

      expect(relevantPosts).toEqual([]);
    });

    test('skips all posts if LLM returns invalid JSON', async () => {
      llm.run.mockResolvedValue('this is not valid JSON');
      const relevantPosts = await filterRelevantPosts(fakePosts, llm);

      expect(relevantPosts).toEqual([]);
    });
  });
});
