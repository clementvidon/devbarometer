import { describe, expect, test } from 'vitest';

import type { ItemRelevance, WeightedItem } from '../../../domain/entities';
import { blendRelevanceWeight } from './blendRelevanceWeight';

describe(blendRelevanceWeight.name, () => {
  test('multiplies weights by topicScore', () => {
    const weightedItems: WeightedItem[] = [
      {
        sourceFetchRef: 'source',
        itemRef: 'a',
        title: 'a',
        content: 'a',
        score: 1,
        weight: 1,
      },
      {
        sourceFetchRef: 'source',
        itemRef: 'b',
        title: 'b',
        content: 'b',
        score: 1,
        weight: 1,
      },
    ];
    const itemsRelevance: ItemRelevance[] = [
      {
        itemRef: 'a',
        relevant: true,
        category: 'emotional_insight',
        topicScore: 0.9,
        emotionScore: 0.9,
        genreScore: 0.9,
      },
      {
        itemRef: 'b',
        relevant: true,
        category: 'emotional_insight',
        topicScore: 0.3,
        emotionScore: 0.9,
        genreScore: 0.9,
      },
    ];

    const result = blendRelevanceWeight(weightedItems, itemsRelevance);

    expect(result).toEqual([
      {
        ...weightedItems[0],
        weight: 0.9,
      },
      {
        ...weightedItems[1],
        weight: 0.3,
      },
    ]);
  });

  test('uses topicFloor when topicScore is missing or too low', () => {
    const weightedItems: WeightedItem[] = [
      {
        sourceFetchRef: 'source',
        itemRef: 'a',
        title: 'a',
        content: 'a',
        score: 1,
        weight: 2,
      },
      {
        sourceFetchRef: 'source',
        itemRef: 'b',
        title: 'b',
        content: 'b',
        score: 1,
        weight: 3,
      },
    ];

    const itemsRelevance: ItemRelevance[] = [
      {
        itemRef: 'a',
        relevant: true,
        category: 'emotional_insight',
        topicScore: 0,
        emotionScore: 0.9,
        genreScore: 0.9,
      },
    ];

    const result = blendRelevanceWeight(weightedItems, itemsRelevance, {
      enabled: true,
      topicFloor: 0.1,
    });

    expect(result).toEqual([
      {
        ...weightedItems[0],
        weight: 0.2,
      },
      {
        ...weightedItems[1],
        weight: 3,
      },
    ]);
  });
});
