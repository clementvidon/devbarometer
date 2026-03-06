import { describe, expect, test, vi, type Mocked } from 'vitest';

vi.mock('./parseEmotion', () => ({
  parseEmotion: vi.fn((raw) => {
    return raw === LlmOutput.VALID
      ? { ...FALLBACK_EMOTIONS, joy: 0.42 }
      : FALLBACK_EMOTIONS;
  }),
}));

vi.mock('./parseTonality', () => ({
  parseTonality: vi.fn((raw) => {
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
 * Spec: Create emotion+tonality profiles for a list of weighted items using the LLM.
 * - Returns `[]` when input is empty (no LLM calls).
 * - For each item, performs 2 LLM calls (emotions + tonalities).
 * - Uses parsed outputs when valid; uses fallbacks when parsing fails.
 * - If the LLM call fails, returns a fallback profile for that item.
 */

describe(createProfiles.name, () => {
  test('turn a list of items into emotion profiles', async () => {
    const logger = makeLogger();
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
    const logger = makeLogger();
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
    const logger = makeLogger();
    const llm = makeLlm(LlmOutput.VALID);
    const items: WeightedItem[] = [];

    const result = await createProfiles(logger, items, llm);

    expect(llm.run).toHaveBeenCalledTimes(0);
    expect(result).toHaveLength(0);
  });
  test('return a fallback when llm throws an error', async () => {
    const logger = makeLogger();
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
