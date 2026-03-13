import { describe, expect, test, vi } from 'vitest';

import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { analyzeItemsRelevance } from './analyzeItemsRelevance';
import { analyzeOneItemRelevance } from './analyzeOneItemRelevance';

vi.mock('./analyzeOneItemRelevance', () => ({
  analyzeOneItemRelevance: vi.fn((_logger, item: Item, _llm, _options) =>
    Promise.resolve({
      itemRef: item.itemRef,
      relevant: true,
      category: 'emotional_insight',
      topicScore: 0.9,
      emotionScore: 0.8,
      genreScore: 0.9,
    }),
  ),
}));

function makeLogger(): LoggerPort {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

function makeLlm(): LlmPort {
  return { run: vi.fn() };
}

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    sourceFetchRef: 'sourceFetchRef',
    itemRef: 'itemRef',
    title: 'title',
    content: 'content',
    score: 0,
    ...overrides,
  };
}

describe(analyzeItemsRelevance.name, () => {
  test('returns one ItemRelevance per input item', async () => {
    const logger = makeLogger();
    const llm = makeLlm();
    const items = [
      makeItem({ itemRef: '1' }),
      makeItem({ itemRef: '2', content: '   ' }),
      makeItem({
        itemRef: '3',
        title: "[MegaThread] Recherches/Offres d'emploi",
      }),
    ];

    const result = await analyzeItemsRelevance(logger, items, llm);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ itemRef: '1', relevant: true });
    expect(result[1]).toMatchObject({ itemRef: '2', relevant: false });
    expect(result[2]).toMatchObject({ itemRef: '3', relevant: false });
  });

  test('demotes items below topic/genre gates', async () => {
    const logger = makeLogger();
    const llm = makeLlm();
    const items = [makeItem({ itemRef: '1' })];

    vi.mocked(analyzeOneItemRelevance).mockResolvedValueOnce({
      itemRef: '1',
      relevant: true,
      category: 'emotional_insight',
      topicScore: 0.4,
      emotionScore: 0.9,
      genreScore: 0.5,
    });

    const result = await analyzeItemsRelevance(logger, items, llm);

    expect(result[0].relevant).toBe(false);
  });
});
