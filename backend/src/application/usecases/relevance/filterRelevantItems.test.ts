import { afterEach, describe, expect, test, vi, type Mocked } from 'vitest';
import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { filterRelevantItems } from './filterRelevantItems';
import { isRelevant } from './isRelevant';

/**
 * Spec: Filters the relevant items from a given list of items
 *
 * Inputs:
 * - a logger
 * - a list of items
 * - an LLM provider
 * - optional configuration
 *
 * Output:
 * - the promise of a list of relevant items
 *
 * Side effects:
 * - creates a child logger / uses the provided logger
 * - triggers LLM calls via isRelevant
 *
 * Behavior
 * - returns [] if input is empty
 * - merges default/custom config
 * - calls isRelevant for each item
 * - filters relevant items
 *
 * Invariants:
 * - output length <= input length
 * - preserves original item order
 */

function makeLlm(): Mocked<LlmPort> {
  return {
    run: vi.fn(),
  };
}

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    source: 'source',
    title: 'title',
    content: 'content',
    score: 0,
    ...overrides,
  };
}

type LoggerDouble = {
  logger: Mocked<LoggerPort>;
  childLogger: Mocked<LoggerPort>;
};

function makeLoggerDouble(): LoggerDouble {
  const childLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn((_context) => childLogger),
  };
  return { logger, childLogger };
}

vi.mock('./isRelevant', () => ({
  isRelevant: vi.fn((_logger, item: Item, _llm, _options) =>
    Promise.resolve(item.title === 'yes'),
  ),
}));

describe('filterRelevantItems', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('filters relevant items', async () => {
    const { logger } = makeLoggerDouble();
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
    const { logger } = makeLoggerDouble();
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
    const { logger } = makeLoggerDouble();
    const llm = makeLlm();
    const items: Item[] = [];

    const result = await filterRelevantItems(logger, items, llm);

    expect(result).toEqual([]);
    expect(isRelevant).not.toHaveBeenCalled();
  });
});
