import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { filterRelevantPosts } from './filterRelevantPosts';
import type { Post } from '../core/entity/Post';

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
      type AgentMessage = { role: 'system' | 'user'; content: string };
      llm = {
        run: vi.fn(
          async (_model: string, messages: AgentMessage[]): Promise<string> => {
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
      expect(relevantPosts.map((post) => post.title)).toEqual([
        'Relevant Post A',
        'Relevant Post B',
      ]);
    });
  });
});
