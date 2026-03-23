import { describe, expect, test } from 'vitest';

import {
  PipelineSnapshotSchema,
  type SnapshotData,
  SnapshotDataSchema,
} from './PipelineSnapshot';

/**
 * Spec: Validate the persisted pipeline snapshot runtime shape.
 */

function makeSnapshotData(): SnapshotData {
  return {
    status: 'ok',
    issues: [
      {
        code: 'code',
        message: 'message',
      },
    ],
    fetchedItems: [
      {
        sourceFetchRef: 'sourceFetchRef',
        itemRef: 'item',
        title: 'title',
        content: 'Content 1',
        score: 42,
      },
    ],
    itemsRelevance: [
      {
        itemRef: 'item',
        relevant: true,
        category: 'emotional_insight',
        topicScore: 0.9,
        emotionScore: 0.8,
        genreScore: 0.95,
      },
    ],
    weightedItems: [
      {
        sourceFetchRef: 'sourceFetchRef',
        itemRef: 'item',
        title: 'title',
        content: 'Content 1',
        score: 42,
        weight: 1.5,
      },
    ],
    weightedSentimentProfiles: [
      {
        itemRef: 'item',
        status: 'ok',
        emotions: {
          joy: 0.1,
          trust: 0.2,
          anger: 0,
          fear: 0,
          sadness: 0,
          disgust: 0,
        },
        tonalities: {
          positive: 0.3,
          negative: 0.1,
          positive_surprise: 0,
          negative_surprise: 0,
          optimistic_anticipation: 0,
          pessimistic_anticipation: 0,
        },
        weight: 1.5,
      },
    ],
    aggregatedSentimentProfile: {
      count: 1,
      confidenceMass: 1.5,
      emotions: {
        joy: 0.1,
        trust: 0.2,
        anger: 0,
        fear: 0,
        sadness: 0,
        disgust: 0,
      },
      tonalities: {
        positive: 0.3,
        negative: 0.1,
        positive_surprise: 0,
        negative_surprise: 0,
        optimistic_anticipation: 0,
        pessimistic_anticipation: 0,
      },
    },
    report: {
      text: 'hello',
      emoji: '☀️',
    },
  };
}

describe('SnapshotDataSchema', () => {
  test('parses correct snapshot', () => {
    expect(() => SnapshotDataSchema.parse(makeSnapshotData())).not.toThrow();
  });

  describe('status and issues', () => {
    test("accepts status 'ok' with empty issues", () => {
      const snapshot = {
        ...makeSnapshotData(),
        status: 'ok',
        issues: [],
      };

      expect(() => SnapshotDataSchema.parse(snapshot)).not.toThrow();
    });

    test("accepts status 'degraded' with issues", () => {
      const snapshot = {
        ...makeSnapshotData(),
        status: 'degraded',
        issues: [
          {
            code: 'missing_profiles',
            message: 'Some sentiment profiles were generated in fallback mode.',
          },
        ],
      };

      expect(() => SnapshotDataSchema.parse(snapshot)).not.toThrow();
    });

    test('rejects snapshots missing status or issues', () => {
      const snapshot = makeSnapshotData();
      const { status: _status, ...missingStatus } = snapshot;
      const { issues: _issues, ...missingIssues } = snapshot;

      expect(() => SnapshotDataSchema.parse(missingStatus)).toThrow();
      expect(() => SnapshotDataSchema.parse(missingIssues)).toThrow();
    });
  });

  test('rejects snapshots missing fetchedItems', () => {
    const snapshot = makeSnapshotData();
    const { fetchedItems: _fetchedItems, ...invalid } = snapshot;

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects snapshots missing itemsRelevance', () => {
    const snapshot = makeSnapshotData();
    const { itemsRelevance: _itemsRelevance, ...invalid } = snapshot;

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects legacy weighted sentiment profiles nested under profile', () => {
    const invalid = {
      ...makeSnapshotData(),
      weightedSentimentProfiles: [
        {
          profile: {
            sourceFetchRef: 'sourceFetchRef',
            itemRef: 'item',
            status: 'ok',
            emotions: {
              joy: 0.1,
              trust: 0.2,
              anger: 0,
              fear: 0,
              sadness: 0,
              disgust: 0,
            },
            tonalities: {
              positive: 0.3,
              negative: 0.1,
              positive_surprise: 0,
              negative_surprise: 0,
              optimistic_anticipation: 0,
              pessimistic_anticipation: 0,
            },
          },
          weight: 1.5,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects legacy sentiment profiles containing title', () => {
    const invalid = {
      ...makeSnapshotData(),
      weightedSentimentProfiles: [
        {
          itemRef: 'item',
          title: 'title',
          status: 'ok',
          emotions: {
            joy: 0.1,
            trust: 0.2,
            anger: 0,
            fear: 0,
            sadness: 0,
            disgust: 0,
          },
          tonalities: {
            positive: 0.3,
            negative: 0.1,
            positive_surprise: 0,
            negative_surprise: 0,
            optimistic_anticipation: 0,
            pessimistic_anticipation: 0,
          },
          weight: 1.5,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects legacy snapshots containing relevant items', () => {
    const invalid = {
      ...makeSnapshotData(),
      relevantItems: [],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects NaN weight in weighted items', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedItems: [
        {
          ...snapshot.weightedItems[0],
          weight: NaN,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects Infinity weight in weightedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedItems: [
        {
          ...snapshot.weightedItems[0],
          weight: Infinity,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects negative weight in weightedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedItems: [
        {
          ...snapshot.weightedItems[0],
          weight: -1,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects negative weight in weightedSentimentProfiles', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedSentimentProfiles: [
        {
          ...snapshot.weightedSentimentProfiles[0],
          weight: -1,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects NaN score in fetchedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      fetchedItems: [
        {
          ...snapshot.fetchedItems[0],
          score: NaN,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects Infinity score in fetchedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      fetchedItems: [
        {
          ...snapshot.fetchedItems[0],
          score: Infinity,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects NaN score in weightedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedItems: [
        {
          ...snapshot.weightedItems[0],
          score: NaN,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects Infinity score in weightedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedItems: [
        {
          ...snapshot.weightedItems[0],
          score: Infinity,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('accepts negative score in fetchedItems and weightedItems', () => {
    const snapshot = makeSnapshotData();
    const valid = {
      ...snapshot,
      fetchedItems: [
        {
          ...snapshot.fetchedItems[0],
          score: -42,
        },
      ],
      weightedItems: [
        {
          ...snapshot.weightedItems[0],
          score: -42,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(valid)).not.toThrow();
  });

  test('rejects blank itemRef in fetchedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      fetchedItems: [
        {
          ...snapshot.fetchedItems[0],
          itemRef: '   ',
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects blank title in fetchedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      fetchedItems: [
        {
          ...snapshot.fetchedItems[0],
          title: '   ',
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects blank sourceFetchRef in fetchedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      fetchedItems: [
        {
          ...snapshot.fetchedItems[0],
          sourceFetchRef: '   ',
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects blank sourceFetchRef in weightedItems', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedItems: [
        {
          ...snapshot.weightedItems[0],
          sourceFetchRef: '   ',
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects snapshots when weightedItems and weightedSentimentProfiles lengths differ', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedSentimentProfiles: [],
      aggregatedSentimentProfile: {
        ...makeSnapshotData().aggregatedSentimentProfile,
        count: 0,
        confidenceMass: 0,
      },
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects snapshots when fetchedItems and itemsRelevance lengths differ', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      itemsRelevance: [],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects snapshots when fetchedItems and itemsRelevance are not aligned', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      itemsRelevance: [
        {
          ...snapshot.itemsRelevance[0],
          itemRef: 'other-item',
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects snapshots when weightedItems and weightedSentimentProfiles are not aligned', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedItems: [
        {
          ...snapshot.weightedItems[0],
          itemRef: 'item-a',
        },
      ],
      weightedSentimentProfiles: [
        {
          ...snapshot.weightedSentimentProfiles[0],
          itemRef: 'item-b',
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects fallback weighted sentiment profiles with non-zero weight', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      weightedSentimentProfiles: [
        {
          ...snapshot.weightedSentimentProfiles[0],
          status: 'fallback',
          weight: 1.5,
        },
      ],
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects snapshots with inconsistent aggregatedSentimentProfile.count', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      aggregatedSentimentProfile: {
        ...snapshot.aggregatedSentimentProfile,
        count: 999,
      },
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });

  test('rejects snapshots with inconsistent aggregatedSentimentProfile.confidenceMass', () => {
    const snapshot = makeSnapshotData();
    const invalid = {
      ...snapshot,
      aggregatedSentimentProfile: {
        ...snapshot.aggregatedSentimentProfile,
        confidenceMass: 999,
      },
    };

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });
});

describe('PipelineSnapshotSchema', () => {
  test('parses a persisted snapshot with id and createdAt', () => {
    const snapshot = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2026-03-09T12:00:00.000Z',
      ...makeSnapshotData(),
    };

    expect(() => PipelineSnapshotSchema.parse(snapshot)).not.toThrow();
  });

  test('rejects a persisted snapshot with inconsistent aggregated confidenceMass', () => {
    const profileWeight = 1.5;
    const inconsistentConfidenceMass = 999;
    const snapshot = makeSnapshotData();

    const invalid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2026-03-09T12:00:00.000Z',
      ...snapshot,
      weightedSentimentProfiles: [
        {
          ...makeSnapshotData().weightedSentimentProfiles[0],
          weight: profileWeight,
        },
      ],
      aggregatedSentimentProfile: {
        ...makeSnapshotData().aggregatedSentimentProfile,
        confidenceMass: inconsistentConfidenceMass,
      },
    };

    expect(() => PipelineSnapshotSchema.parse(invalid)).toThrow();
  });
});
