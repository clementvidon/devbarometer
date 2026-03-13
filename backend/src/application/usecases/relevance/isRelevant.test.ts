import { afterEach, describe, expect, type Mocked, test, vi } from 'vitest';

import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { isRelevant } from './isRelevant';
import { DEFAULT_RELEVANCE_ON_ERROR } from './policy';

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
    sourceFetchRef: 'sourceFetchRef',
    itemRef: 'itemRef',
    title: 'title',
    content: 'content',
    score: 0,
    ...overrides,
  };
}

/**
 * Spec: Determine whether a given item is relevant using the LLM.
 * - Calls the LLM once with the configured model/prompt/run options.
 * - Returns the parsed relevance boolean on success.
 * - Returns DEFAULT_RELEVANCE_ON_ERROR if the LLM call fails.
 */

describe(isRelevant.name, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('return true when the item is relevant', async () => {
    const logger = makeLogger();
    const item = makeItem();
    const llm = makeLlm();
    llm.run.mockResolvedValue(
      '{ "relevant": true, "category": "emotional_insight", "topicScore": 0.9, "emotionScore": 0.8, "genreScore": 0.9 }',
    );

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
    llm.run.mockResolvedValue(
      '{ "relevant": false, "category": "factual_insight", "topicScore": 0.9, "emotionScore": 0.1, "genreScore": 0.9 }',
    );

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
