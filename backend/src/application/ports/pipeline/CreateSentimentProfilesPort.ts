import type { RelevantItem, SentimentProfile } from '../../../domain/entities';
import type { LlmRunOptions } from '../output/LlmPort';
import type { LoggerPort } from '../output/LoggerPort';

export interface CreateSentimentProfilesOptions {
  /** System prompt to evaluate emotions */
  emotionPrompt: string;
  /** System prompt to evaluate tonalities */
  tonalityPrompt: string;
  /** LLM calls concurrency limit */
  concurrency: number;
  /** Standard LLM Options (including the model) */
  llmOptions: LlmRunOptions & { model: string };
}

/**
 * Create emotion/tonality profiles for relevant items in the pipeline.
 *
 * Contract (interface-wide):
 * - Inputs are read-only; `items` may be empty; output order is preserved.
 * - Output has one profile per input item (same ordering).
 * - Each profile is derived from the corresponding item (e.g., keeps `itemRef`).
 * - May perform external I/O (e.g. LLM calls) and log via the provided logger.
 * - On per-item failures, implementations may return fallback profiles.
 */
export interface CreateSentimentProfilesPort {
  /** Returns one SentimentProfile per input item (order preserved). */
  createSentimentProfiles(
    logger: LoggerPort,
    items: RelevantItem[],
    opts?: Partial<CreateSentimentProfilesOptions>,
  ): Promise<SentimentProfile[]>;
}
