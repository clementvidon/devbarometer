import { describe, expect, test } from 'vitest';

import type { Item, ItemRelevance } from '../../../domain/entities';
import { selectRelevantItems } from './selectRelevantItems';

describe(selectRelevantItems.name, () => {
  test('keeps only relevant items while preserving input order', () => {
    const items: Item[] = [
      {
        sourceFetchRef: 'source',
        itemRef: '1',
        title: 'a',
        content: 'a',
        score: 1,
      },
      {
        sourceFetchRef: 'source',
        itemRef: '2',
        title: 'b',
        content: 'b',
        score: 1,
      },
      {
        sourceFetchRef: 'source',
        itemRef: '3',
        title: 'c',
        content: 'c',
        score: 1,
      },
    ];

    const itemsRelevance: ItemRelevance[] = [
      {
        itemRef: '1',
        relevant: false,
        category: 'noise',
        topicScore: 0,
        emotionScore: 0,
        genreScore: 0,
      },
      {
        itemRef: '2',
        relevant: true,
        category: 'emotional_insight',
        topicScore: 0.9,
        emotionScore: 0.8,
        genreScore: 0.9,
      },
      {
        itemRef: '3',
        relevant: true,
        category: 'emotional_insight',
        topicScore: 0.7,
        emotionScore: 0.6,
        genreScore: 0.9,
      },
    ];

    expect(
      selectRelevantItems(items, itemsRelevance).map((item) => item.itemRef),
    ).toEqual(['2', '3']);
  });
});
