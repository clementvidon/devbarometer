import { afterEach, describe, expect, type Mocked, test, vi } from 'vitest';

vi.mock('./analyzeItemsRelevance', () => ({
  analyzeItemsRelevance: vi.fn((_logger, items: Item[], _llm, _options) =>
    Promise.resolve(
      items.map((item) => ({
        itemRef: item.itemRef,
        relevant: item.title === 'yes',
        category:
          item.title === 'yes' ? 'emotional_insight' : 'factual_insight',
        topicScore: item.title === 'yes' ? 0.9 : 0.8,
        emotionScore: item.title === 'yes' ? 0.8 : 0.1,
        genreScore: item.title === 'yes' ? 0.9 : 0.8,
      })),
    ),
  ),
}));

import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { analyzeItemsRelevance } from './analyzeItemsRelevance';
import { filterRelevantItems } from './filterRelevantItems';

let nextItemId = 0;
function makeItem(overrides: Partial<Item> = {}): Item {
  nextItemId += 1;
  return {
    sourceFetchRef: 'sourceFetchRef',
    itemRef: `itemRef-${String(nextItemId)}`,
    title: 'title',
    content: 'content',
    score: 0,
    ...overrides,
  };
}

function makeLlm(): Mocked<LlmPort> {
  return {
    run: vi.fn(),
  };
}

function makeLogger(): Mocked<LoggerPort> {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
}

/**
 * Spec: Filter relevant items from a list.
 * - Returns an empty result when input is empty.
 * - Delegates relevance analysis to `analyzeItemsRelevance`.
 * - Preserves original order of items that are kept.
 */

describe(filterRelevantItems.name, () => {
  afterEach(() => {
    vi.clearAllMocks();
    nextItemId = 0;
  });

  test('filters relevant items', async () => {
    const logger = makeLogger();
    const llm = makeLlm();
    const items = [
      makeItem({ itemRef: '1', title: 'yes' }),
      makeItem({ itemRef: '2', title: 'nop' }),
      makeItem({ itemRef: '3', title: 'nop' }),
      makeItem({ itemRef: '4', title: 'yes' }),
    ];
    const expectedRelevant = items.filter((i) => i.title === 'yes');

    const result = await filterRelevantItems(logger, items, llm);

    expect(result.relevantItems).toEqual(expectedRelevant);
    expect(result.itemsRelevance).toHaveLength(items.length);
    expect(analyzeItemsRelevance).toHaveBeenCalledTimes(1);
  });

  test('preserves original order of relevant items', async () => {
    const logger = makeLogger();
    const llm = makeLlm();
    const items = [
      makeItem({ itemRef: '1', title: 'yes', content: '3' }),
      makeItem({ itemRef: '2', title: 'nop', content: '2' }),
      makeItem({ itemRef: '3', title: 'yes', content: '1' }),
    ];

    const result = await filterRelevantItems(logger, items, llm);

    expect(result.relevantItems.map((i) => i.content)).toEqual(['3', '1']);
  });

  test('returns empty array if input is empty', async () => {
    const logger = makeLogger();
    const llm = makeLlm();
    const items: Item[] = [];

    const result = await filterRelevantItems(logger, items, llm);

    expect(result).toEqual({ relevantItems: [], itemsRelevance: [] });
    expect(analyzeItemsRelevance).not.toHaveBeenCalled();
  });
});
