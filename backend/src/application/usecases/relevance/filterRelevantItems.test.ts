import { afterEach, describe, expect, test, vi, type Mocked } from 'vitest';
import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { filterRelevantItems } from './filterRelevantItems';
import { isRelevant } from './isRelevant';

/**
 * Spec: Filters relevant items
 *
 * Inputs:
 * - a logger (LoggerPort)
 * - an array of items (Item[])
 * - a LLM provider (LlmPort)
 * - optional filter configuration
 *
 * Output:
 * - a promise resolving to an array of RelevantItem
 *
 * Side effects:
 * - creates a child logger
 * - logs start and end of the filtering process
 * - triggers LLM calls via isRelevant
 *
 * Behavior
 * - creates a child logger scoped to 'relevance.filter'
 * - logs the total number of input items
 * - log and returns [] immediately if input array is empty
 * - merges default and custom options
 * - limits concurrency using p-limit
 * - calls isRelevant for each item
 * - keeps only items marked as relevant
 * - logs total, relevant and discarded counts
 *
 * Invariants:
 * - always returns an array
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
    const { logger, childLogger } = makeLoggerDouble();
    const llm = makeLlm();
    const items = [
      makeItem({ title: 'yes' }),
      makeItem({ title: 'nop' }),
      makeItem({ title: 'nop' }),
      makeItem({ title: 'yes' }),
    ];

    const result = await filterRelevantItems(logger, items, llm);

    // result
    const expectedRelevant = items.filter((i) => i.title === 'yes');
    expect(result).toEqual(expectedRelevant);
    expect(isRelevant).toHaveBeenCalledTimes(items.length);
    // logging
    expect(logger.child).toHaveBeenCalledWith({
      module: 'relevance.filter',
    });
    expect(childLogger.info).toHaveBeenCalledWith('Start relevance filter', {
      total: items.length,
    });
    expect(childLogger.info).toHaveBeenCalledWith('End relevance filter', {
      total: items.length,
      discarded: items.length - expectedRelevant.length,
      relevant: expectedRelevant.length,
    });
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
    const { logger, childLogger } = makeLoggerDouble();
    const llm = makeLlm();
    const items: Item[] = [];

    const result = await filterRelevantItems(logger, items, llm);

    // result
    expect(result).toEqual([]);
    expect(isRelevant).not.toHaveBeenCalled();
    // logging
    expect(logger.child).toHaveBeenCalledWith({
      module: 'relevance.filter',
    });
    expect(childLogger.info).toHaveBeenCalledWith('Start relevance filter', {
      total: items.length,
    });
    expect(childLogger.info).toHaveBeenCalledWith('End relevance filter', {
      total: 0,
      relevant: 0,
      discarded: 0,
    });
  });
});
