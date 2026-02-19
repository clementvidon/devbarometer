import { describe, expect, test, vi, type Mocked } from 'vitest';

vi.mock('./parseEmotion', () => ({
  parseEmotionRaw: vi.fn((raw) => {
    return raw === LlmOutput.VALID
      ? { ...FALLBACK_EMOTIONS, joy: 0.42 }
      : FALLBACK_EMOTIONS;
  }),
}));

vi.mock('./parseTonality', () => ({
  parseTonalityRaw: vi.fn((raw) => {
    return raw === LlmOutput.VALID
      ? { ...FALLBACK_TONALITIES, positive: 0.42 }
      : FALLBACK_TONALITIES;
  }),
}));

import type { WeightedItem } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { createProfiles } from './createProfiles';
import { FALLBACK_EMOTIONS, FALLBACK_TONALITIES } from './policy';

/**
 * Spec: Turn a list of items into emotion profiles
 *
 * Inputs:
 * - a logger
 * - a list of items
 * - an LLM provider
 * - optional configuration
 *
 * Output:
 * - the promise of a list of emotion profiles
 * - emotion profile = emotion scores + tonality scores
 *
 * Side effects:
 * - creates a child logger / uses the provided logger
 * - triggers LLM calls
 *
 * Behavior:
 * - for each item
 *  - builds LLM messages (for emotions and tonalities)
 *  - calls LLM with messages and options (for emotions and tonalities)
 *  - parses the raw LLM response (for emotions and tonalities)
 *  - uses fallback if parsing fails (for emotions and tonalities)
 *  - creates an emotion profile (emotions + tonalities)
 * - returns a list of emotion profiles
 * - returns [] if input is empty
 */

function makeWeightedItem(overrides: Partial<WeightedItem> = {}): WeightedItem {
  return {
    source: 'source',
    title: 'title',
    content: 'content',
    score: 1,
    weight: 1,
    ...overrides,
  };
}

enum LlmOutput {
  VALID = 'valid',
  INVALID = 'invalid',
}

function makeLlm(raw: string): Mocked<LlmPort> {
  return {
    run: vi.fn().mockResolvedValue(raw),
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

describe('createProfiles', () => {
  test('turn a list of items into emotion profiles', async () => {
    const { logger } = makeLoggerDouble();
    const llm = makeLlm(LlmOutput.VALID);
    const items = [makeWeightedItem(), makeWeightedItem(), makeWeightedItem()];

    const result = await createProfiles(logger, items, llm);

    expect(llm.run).toHaveBeenCalledTimes(items.length * 2);
    expect(result).toHaveLength(items.length);
    result.forEach((profile) => {
      expect(profile.emotions.joy).toBe(0.42);
      expect(profile.tonalities.positive).toBe(0.42);
      expect(profile.weight).toBe(1);
    });
  });
  test('returns fallback when parsing fails', async () => {
    const { logger } = makeLoggerDouble();
    const llm = makeLlm(LlmOutput.INVALID);
    const items = [makeWeightedItem(), makeWeightedItem(), makeWeightedItem()];

    const result = await createProfiles(logger, items, llm);

    expect(llm.run).toHaveBeenCalledTimes(items.length * 2);
    expect(result).toHaveLength(items.length);
    result.forEach((profile) => {
      expect(profile.emotions.joy).toBe(0);
      expect(profile.tonalities.positive).toBe(0);
      expect(profile.weight).toBe(0);
    });
  });
  test('returns empty array if input is empty', async () => {
    const { logger } = makeLoggerDouble();
    const llm = makeLlm(LlmOutput.VALID);
    const items: WeightedItem[] = [];

    const result = await createProfiles(logger, items, llm);

    expect(llm.run).toHaveBeenCalledTimes(0);
    expect(result).toHaveLength(0);
  });
  test('return a fallback when llm throws an error', async () => {
    const { logger } = makeLoggerDouble();
    const llm = {
      run: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const items = [makeWeightedItem(), makeWeightedItem(), makeWeightedItem()];

    const result = await createProfiles(logger, items, llm);

    expect(llm.run).toHaveBeenCalledTimes(items.length * 2);
    expect(result).toHaveLength(items.length);
    result.forEach((profile) => {
      expect(profile.emotions.joy).toBe(0);
      expect(profile.tonalities.positive).toBe(0);
      expect(profile.weight).toBe(0);
    });
  });
});
