import { afterEach, describe, expect, type Mocked, test, vi } from 'vitest';

import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { analyzeOneItemRelevance } from './analyzeOneItemRelevance';

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
  return { run: vi.fn() };
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

describe('analyzeOneItemRelevance', () => {
  afterEach(() => vi.restoreAllMocks());

  test('returns full triad output', async () => {
    const logger = makeLogger();
    const item = makeItem();
    const llm = makeLlm();
    llm.run.mockResolvedValue(
      '{ "relevant": true, "category": "emotional_insight", "topicScore": 0.9, "emotionScore": 0.8, "genreScore": 0.95 }',
    );

    await expect(
      analyzeOneItemRelevance(logger, item, llm, {
        prompt: 'prompt',
        model: 'model',
        runOpts: {},
      }),
    ).resolves.toEqual({
      itemRef: 'itemRef',
      relevant: true,
      category: 'emotional_insight',
      topicScore: 0.9,
      emotionScore: 0.8,
      genreScore: 0.95,
    });
  });
});
