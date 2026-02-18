import { afterEach, describe, expect, test, vi, type Mocked } from 'vitest';
import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { isRelevant } from './isRelevant';
import { DEFAULT_RELEVANCE_ON_ERROR } from './policy';

/**
 * Spec: Determine whether a given item is relevant using an LLM
 *
 * Inputs:
 * - a logger (LoggerPort)
 * - an item (Item)
 * - a LLM provider (LlmPort)
 * - a set of options
 *  - a prompt (string)
 *  - an LLM model (string)
 *  - LLM run options (LlmRunOptions)
 *
 * Output:
 * - a Promise<boolean>, resolves to:
 *  - the parsed relevance result when LLM call succeeds
 *  - DEFAULT_RELEVANCE_ON_ERROR if an error occurs
 *
 * Side effects:
 * - calls the LLM provider via llm.run
 * - logs a warning if the LLM call fails
 *
 * Behavior:
 * - builds LLM messages from the item and prompt
 * - calls llm.run with the given model and options
 * - parses the raw LLM response using parseRelevanceRaw
 * - logs a warning if LLM call fails
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
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
