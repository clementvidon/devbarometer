import { describe, expect, test } from 'vitest';
import {
  PipelineSnapshotSchema,
  SnapshotDataSchema,
  type SnapshotData,
} from './PipelineSnapshot';

/**
 * Spec: Validate the persisted pipeline snapshot runtime shape.
 */

function makeSnapshotData(): SnapshotData {
  return {
    fetchRef: 'fetch-ref',
    inputItems: [
      {
        itemRef: 'item',
        title: 'title',
        content: 'Content 1',
        score: 42,
      },
    ],
    weightedItems: [
      {
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
      totalWeight: 1.5,
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
  test('parses the final persisted shape', () => {
    expect(() => SnapshotDataSchema.parse(makeSnapshotData())).not.toThrow();
  });
  test('rejects if inputItems is missing', () => {
    const snapshot = makeSnapshotData();
    const { inputItems: _inputItems, ...invalid } = snapshot;

    expect(() => SnapshotDataSchema.parse(invalid)).toThrow();
  });
  test('rejects former weightedSentimentProfiles with nested profile', () => {
    const invalid = {
      ...makeSnapshotData(),
      weightedSentimentProfiles: [
        {
          profile: {
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
  test('rejects former sentiment profiles with title', () => {
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
  test('rejects former snapshots with relevantItems', () => {
    const invalid = {
      ...makeSnapshotData(),
      relevantItems: [],
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
});
