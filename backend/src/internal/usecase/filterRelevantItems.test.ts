import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Item } from '../core/entity/Item.ts';
import { filterRelevantItems } from './filterRelevantItems.ts';

const fakeItems: Item[] = [
  {
    source: 'a1',
    title: 'Relevant Item A',
    content: 'Insightful',
    weight: 10,
  },
  {
    source: 'b2',
    title: 'Relevant Item B',
    content: 'Insightful',
    weight: 5,
  },
  {
    source: 'c3',
    title: 'Irrelevant Item',
    content: 'Off-topic',
    weight: 20,
  },
];

describe('filterRelevantItems', () => {
  describe('Happy path', () => {
    let llm: { run: Mock };

    beforeEach(() => {
      vi.clearAllMocks();
      type LocalMsg = { role: 'system' | 'user'; content: string };
      llm = {
        run: vi.fn((model: string, messages: LocalMsg[]) => {
          const content = messages[1].content;
          return content.includes('Relevant')
            ? '{ "relevant": true }'
            : '{ "relevant": false }';
        }),
      };
    });

    test('filters relevant data points correctly', async () => {
      const relevantItems = await filterRelevantItems(fakeItems, llm);

      expect(relevantItems).toHaveLength(2);
      expect(relevantItems.map((p) => p.title)).toEqual([
        'Relevant Item A',
        'Relevant Item B',
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
      const relevantItems = await filterRelevantItems(fakeItems, llm);

      expect(relevantItems).toEqual([]);
    });

    test('skips all items if LLM returns invalid JSON', async () => {
      llm.run.mockResolvedValue('this is not valid JSON');
      const relevantItems = await filterRelevantItems(fakeItems, llm);

      expect(relevantItems).toEqual([]);
    });
  });
});
