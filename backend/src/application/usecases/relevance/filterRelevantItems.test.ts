import { afterEach, describe, expect, type Mocked, test, vi } from 'vitest';

vi.mock('./isRelevant', () => ({
  isRelevant: vi.fn((_logger, item: Item, _llm, _options) =>
    Promise.resolve(item.title === 'yes'),
  ),
}));

import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { filterRelevantItems } from './filterRelevantItems';
import { isRelevant } from './isRelevant';

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
 * - Returns `[]` when input is empty (does not call `isRelevant`).
 * - Calls `isRelevant` once per item otherwise.
 * - Preserves original order of items that are kept.
 */

describe(filterRelevantItems.name, () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('filters relevant items', async () => {
    const logger = makeLogger();
    const llm = makeLlm();
    const items = [
      makeItem({ title: 'yes' }),
      makeItem({ title: 'nop' }),
      makeItem({ title: 'nop' }),
      makeItem({ title: 'yes' }),
    ];
    const expectedRelevant = items.filter((i) => i.title === 'yes');

    const result = await filterRelevantItems(logger, items, llm);

    expect(result).toEqual(expectedRelevant);
    expect(isRelevant).toHaveBeenCalledTimes(items.length);
  });

  test('preserves original order of relevant items', async () => {
    const logger = makeLogger();
    const llm = makeLlm();
    const items = [
      makeItem({ title: 'yes', content: '3' }),
      makeItem({ title: 'nop', content: '2' }),
      makeItem({ title: 'yes', content: '1' }),
    ];

    const result = await filterRelevantItems(logger, items, llm);

    expect(result.map((i) => i.content)).toEqual(['3', '1']);
  });

  test('returns empty array if input is empty', async () => {
    const logger = makeLogger();
    const llm = makeLlm();
    const items: Item[] = [];

    const result = await filterRelevantItems(logger, items, llm);

    expect(result).toEqual([]);
    expect(isRelevant).not.toHaveBeenCalled();
  });
});
