import { afterEach, describe, expect, test, vi, type Mocked } from 'vitest';
import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { isRelevant } from './isRelevant';
import { DEFAULT_RELEVANCE_ON_ERROR } from './policy';

/**
 * Spec: Determine whether a given item is relevant
 *
 * Inputs:
 * - a logger
 * - an item
 * - a LLM provider
 * - a set of options for the LLM
 *  - a prompt
 *  - an LLM model
 *  - LLM run options
 *
 * Output:
 * - the promise of a boolean answer:
 *  - true if the LLM judged the item as relevant
 *  - false if the LLM judged the item as irrelevant
 *  - DEFAULT_RELEVANCE_ON_ERROR if an error occurs
 *
 * Side effects:
 * - triggers LLM calls
 * - uses the provided logger
 *
 * Behavior:
 * - builds LLM messages
 * - calls LLM with messages and options
 * - parses the raw LLM response
 * - returns DEFAULT_RELEVANCE_ON_ERROR if an error occurs
 */

function makeLogger(): Mocked<LoggerPort> {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
}

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

describe('isRelevant', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('return true when the item is relevant', async () => {
    const logger = makeLogger();
    const item = makeItem();
    const llm = makeLlm();
    llm.run.mockResolvedValue('{ "relevant": true }');

    const result = await isRelevant(logger, item, llm, {
      prompt: 'prompt',
      model: 'model',
      runOpts: {},
    });

    expect(result).toBe(true);
    expect(llm.run).toHaveBeenCalledTimes(1);
    expect(llm.run).toHaveBeenCalledWith('model', expect.any(Array), {});
  });

  test('return false when the item is not relevant', async () => {
    const logger = makeLogger();
    const item = makeItem();
    const llm = makeLlm();
    llm.run.mockResolvedValue('{ "relevant": false }');

    const result = await isRelevant(logger, item, llm, {
      prompt: 'prompt',
      model: 'model',
      runOpts: {},
    });

    expect(result).toBe(false);
    expect(llm.run).toHaveBeenCalledTimes(1);
    expect(llm.run).toHaveBeenCalledWith('model', expect.any(Array), {});
  });

  test('return false when llm throws an error', async () => {
    const logger = makeLogger();
    const item = makeItem();
    const llm = makeLlm();
    llm.run.mockRejectedValue(new Error('boom'));

    const result = await isRelevant(logger, item, llm, {
      prompt: 'prompt',
      model: 'model',
      runOpts: {},
    });

    expect(result).toBe(DEFAULT_RELEVANCE_ON_ERROR);
    expect(llm.run).toHaveBeenCalledTimes(1);
    expect(llm.run).toHaveBeenCalledWith('model', expect.any(Array), {});
  });
});
