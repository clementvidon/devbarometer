import { describe, expect, test, vi } from 'vitest';
import type { RelevantItem } from '../../../domain/entities';
import type { PipelineSnapshot } from '../../../domain/value-objects/PipelineSnapshot';
import type { PersistencePort } from '../../ports/output/PersistencePort';
import { getLastRelevantItemsBefore } from './getLastRelevantItemsBefore';

/**
 * Spec: Returns relevant items from the closest snapshot strictly before a given date.
 *
 * Inputs:
 * - a reference ISO date (string)
 * - a persistence port providing snapshots
 *
 * Output:
 * - RelevantItem[] from the most recent snapshot with createdAt < reference date
 * - [] if no such snapshot exists
 *
 * Side effects:
 * - reads snapshots from persistence
 *
 * Throws:
 * - if snapshot retrieval fails
 *
 * Behavior:
 * - fetches all snapshots from persistence
 * - ignores snapshots with createdAt >= reference date
 * - selects the snapshot with the greatest createdAt strictly before the reference date
 * - returns its relevantItems
 *
 * Invariants:
 * - always return an array
 * - selection is strictly before (not equal)
 */

function makeRelevantItem(overrides: Partial<RelevantItem> = {}): RelevantItem {
  return {
    source: 'source',
    title: 'title',
    content: 'content',
    score: 1,
    ...overrides,
  };
}

function makeSnapshot(
  overrides: Partial<PipelineSnapshot> = {},
): PipelineSnapshot {
  return {
    id: 'id',
    createdAt: '2001-01-01',
    fetchLabel: 'label',
    items: [],
    relevantItems: [],
    weightedItems: [],
    emotionProfilePerItem: [],
    aggregatedEmotionProfile: {
      count: 0,
      totalWeight: 0,
      emotions: {
        joy: 0,
        trust: 0,
        anger: 0,
        fear: 0,
        sadness: 0,
        disgust: 0,
      },
      tonalities: {
        positive: 0,
        negative: 0,
        positive_surprise: 0,
        negative_surprise: 0,
        optimistic_anticipation: 0,
        pessimistic_anticipation: 0,
      },
    },
    report: {
      text: 'report',
      emoji: '☀️',
    },
    ...overrides,
  };
}

function makePersistence(): PersistencePort {
  const snapshots: PipelineSnapshot[] = [
    makeSnapshot({
      createdAt: '2026-02-01',
      relevantItems: [makeRelevantItem({ title: 'A' })],
    }),
    makeSnapshot({
      createdAt: '2026-02-02',
      relevantItems: [makeRelevantItem({ title: 'B' })],
    }),
    makeSnapshot({
      createdAt: '2026-02-03',
      relevantItems: [makeRelevantItem({ title: 'C' })],
    }),
    makeSnapshot({
      createdAt: '2026-02-04',
      relevantItems: [makeRelevantItem({ title: 'D' })],
    }),
  ];

  const persistence = {
    getSnapshots: vi.fn().mockResolvedValue(snapshots),
    storeSnapshotAt: vi.fn(),
  };
  return persistence;
}

describe('getLastRelevantItemsBefore', () => {
  test('returns relevant items from the closest snapshot before the given date', async () => {
    const createdAtISO = '2026-02-03';
    const persistence = makePersistence();

    const result = await getLastRelevantItemsBefore(createdAtISO, persistence);

    expect(result).toStrictEqual([makeRelevantItem({ title: 'B' })]);
  });
  test('return an empty array if it is not found', async () => {
    const createdAtISO = '1999-01-01';
    const persistence = makePersistence();

    const result = await getLastRelevantItemsBefore(createdAtISO, persistence);

    expect(result).toStrictEqual([]);
  });
});
