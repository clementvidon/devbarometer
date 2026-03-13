import { describe, expect, type Mocked, test, vi } from 'vitest';

vi.mock('./parseReport', () => ({
  parseReport: vi.fn((raw: string) =>
    raw === 'valid'
      ? {
          ok: true,
          value: {
            emoji: '☀️',
            text: 'my-report',
          },
        }
      : {
          ok: false,
          reason: 'invalid_schema',
          value: {
            emoji: '☁️',
            text: '',
          },
        },
  ),
}));

import type {
  EmotionScores,
  Report,
  TonalityScores,
  WeatherEmoji,
} from '@devbarometer/shared/domain';

import type { AggregatedSentimentProfile } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { generateReport } from './generateReport';
import { FALLBACK_REPORT } from './policy';

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
    positive: 1,
    negative: 1,
    positive_surprise: 1,
    negative_surprise: 1,
    optimistic_anticipation: 1,
    pessimistic_anticipation: 1,
    ...overrides,
  };
}
function makeAggregatedSentimentProfile(
  overrides: Partial<AggregatedSentimentProfile> = {},
): AggregatedSentimentProfile {
  return {
    count: 0,
    confidenceMass: 0,
    emotions: makeEmotionScores(),
    tonalities: makeTonalityScores(),
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
 * Spec: Generate a human-readable report from an aggregated sentiment profile.
 * - If `profile.count === 0`, returns FALLBACK_REPORT (no LLM call).
 * - Otherwise calls the LLM with the configured prompt/options and built messages.
 * - Returns a validated Report, or FALLBACK_REPORT on invalid output or errors.
 * - Logs key steps and failures via the provided logger.
 */

describe(generateReport.name, () => {
  const VALID_REPORT: Report = {
    emoji: '☀️' satisfies WeatherEmoji,
    text: 'my-report',
  };
  test('turns an aggregated sentiment profile into a report', async () => {
    const logger = makeLogger();
    const llm = makeLlm(LlmOutput.VALID);
    const profile = makeAggregatedSentimentProfile({ count: 1 });

    const result = await generateReport(logger, profile, llm);

    expect(result).toMatchObject(VALID_REPORT);
  });
  test('returns fallback when parsing fails', async () => {
    const logger = makeLogger();
    const llm = makeLlm(LlmOutput.INVALID);
    const profile = makeAggregatedSentimentProfile({ count: 1 });

    const result = await generateReport(logger, profile, llm);

    expect(result).toMatchObject(FALLBACK_REPORT);
  });
  test('returns fallback if aggregated profile count is 0', async () => {
    const logger = makeLogger();
    const llm = makeLlm(LlmOutput.VALID);
    const profile = makeAggregatedSentimentProfile({ count: 0 });

    const result = await generateReport(logger, profile, llm);

    expect(result).toMatchObject(FALLBACK_REPORT);
    expect(llm.run).not.toHaveBeenCalled();
  });
  test('returns a fallback when llm throws an error', async () => {
    const logger = makeLogger();
    const llm = {
      run: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const profile = makeAggregatedSentimentProfile({ count: 1 });

    const result = await generateReport(logger, profile, llm);

    expect(result).toMatchObject(FALLBACK_REPORT);
  });
});
