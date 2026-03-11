import { describe, expect, test, vi, type Mocked } from 'vitest';

vi.mock('./parseEmotion', () => ({
  parseEmotion: vi.fn((raw: string) =>
    raw === 'valid'
      ? {
          ok: true,
          value: {
            joy: 0.42,
            trust: 0,
            anger: 0,
            fear: 0,
            sadness: 0,
            disgust: 0,
          },
        }
      : {
          ok: false,
          reason: 'invalid_schema',
          value: {
            joy: 0,
            trust: 0,
            anger: 0,
            fear: 0,
            sadness: 0,
            disgust: 0,
          },
        },
  ),
}));

vi.mock('./parseTonality', () => ({
  parseTonality: vi.fn((raw: string) =>
    raw === 'valid'
      ? {
          ok: true,
          value: {
            positive: 0.42,
            negative: 0,
            positive_surprise: 0,
            negative_surprise: 0,
            optimistic_anticipation: 0,
            pessimistic_anticipation: 0,
          },
        }
      : {
          ok: false,
          reason: 'invalid_schema',
          value: {
            positive: 0,
            negative: 0,
            positive_surprise: 0,
            negative_surprise: 0,
            optimistic_anticipation: 0,
            pessimistic_anticipation: 0,
          },
        },
  ),
}));

import type {
  EmotionScores,
  TonalityScores,
} from '@devbarometer/shared/domain';
import type { WeightedItem } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { createSentimentProfiles } from './createSentimentProfiles';

/**
 * Spec: Create emotion+tonality profiles for a list of weighted items using the LLM.
 * - Returns `[]` when input is empty (no LLM calls).
 * - For each item, performs 2 LLM calls (emotions + tonalities).
 * - Uses parsed outputs when valid; uses fallbacks when parsing fails.
 * - If the LLM call fails, returns a fallback profile for that item.
 */

describe(createSentimentProfiles.name, () => {
  function makeEmotionScores(
    overrides: Partial<EmotionScores> = {},
  ): EmotionScores {
    return {
      joy: 0,
      trust: 0,
      anger: 0,
      fear: 0,
      sadness: 0,
      disgust: 0,
      ...overrides,
    };
  }
  function makeTonalityScores(
    overrides: Partial<TonalityScores> = {},
  ): TonalityScores {
    return {
      positive: 0,
      negative: 0,
      positive_surprise: 0,
      negative_surprise: 0,
      optimistic_anticipation: 0,
      pessimistic_anticipation: 0,
      ...overrides,
    };
  }
  function makeWeightedItem(
    overrides: Partial<WeightedItem> = {},
  ): WeightedItem {
    return {
      sourceFetchRef: 'sourceFetchRef',
      itemRef: 'itemRef',
      title: 'title',
      content: 'content',
      score: 1,
      weight: 1,
      ...overrides,
    };
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
  test('turns a list of items into sentiment profiles', async () => {
    const logger = makeLogger();
    const llm = makeLlm('valid');
    const items = [makeWeightedItem(), makeWeightedItem(), makeWeightedItem()];

    const result = await createSentimentProfiles(logger, items, llm);

    expect(llm.run).toHaveBeenCalledTimes(items.length * 2);
    expect(result).toHaveLength(items.length);
    result.forEach((profile, i) => {
      expect(profile).toStrictEqual({
        itemRef: items[i].itemRef,
        emotions: makeEmotionScores({ joy: 0.42 }),
        tonalities: makeTonalityScores({ positive: 0.42 }),
        status: 'ok',
      });
    });
  });
  test('returns fallback when parsing fails', async () => {
    const logger = makeLogger();
    const llm = makeLlm('invalid');
    const items = [makeWeightedItem(), makeWeightedItem(), makeWeightedItem()];

    const result = await createSentimentProfiles(logger, items, llm);

    expect(llm.run).toHaveBeenCalledTimes(items.length * 2);
    expect(result).toHaveLength(items.length);
    result.forEach((profile, i) => {
      expect(profile).toStrictEqual({
        itemRef: items[i].itemRef,
        emotions: makeEmotionScores({ joy: 0 }),
        tonalities: makeTonalityScores({ positive: 0 }),
        status: 'fallback',
      });
    });
  });
  test('returns empty array if input is empty', async () => {
    const logger = makeLogger();
    const llm = makeLlm('valid');
    const items: WeightedItem[] = [];

    const result = await createSentimentProfiles(logger, items, llm);

    expect(llm.run).toHaveBeenCalledTimes(0);
    expect(result).toHaveLength(0);
  });
  test('returns a fallback when llm throws an error', async () => {
    const logger = makeLogger();
    const llm = {
      run: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const items = [makeWeightedItem(), makeWeightedItem(), makeWeightedItem()];

    const result = await createSentimentProfiles(logger, items, llm);

    expect(llm.run).toHaveBeenCalledTimes(items.length * 2);
    expect(result).toHaveLength(items.length);
    result.forEach((profile, i) => {
      expect(profile).toStrictEqual({
        itemRef: items[i].itemRef,
        emotions: makeEmotionScores({ joy: 0 }),
        tonalities: makeTonalityScores({ positive: 0 }),
        status: 'fallback',
      });
    });
  });
});
