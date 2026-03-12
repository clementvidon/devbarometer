import type { Report } from '@devbarometer/shared/domain';

import type { AggregatedSentimentProfile } from '../../../domain/entities';
import type { LlmRunOptions } from '../output/LlmPort';
import type { LoggerPort } from '../output/LoggerPort';

export interface CreateReportOptions {
  /** System prompt for report generation */
  reportPrompt: string;
  /** Standard LLM Options (including the model) */
  llmOptions: LlmRunOptions & { model: string };
}

/**
 * Create a short “weather-style” report from an aggregated Sentiment profile.
 *
 * Contract (interface-wide):
 * - Inputs are read-only; `aggregatedSentimentProfile` is treated as immutable.
 * - Output is a single Report derived from the provided aggregated profile.
 * - May perform external I/O (e.g. LLM calls) and log via the provided logger.
 * - Implementations may return a fallback Report when the LLM fails or output is invalid.
 */
export interface CreateReportPort {
  /** Returns a single Report for the given aggregated sentiment profile. */
  createReport(
    logger: LoggerPort,
    aggregatedSentimentProfile: AggregatedSentimentProfile,
    opts?: Partial<CreateReportOptions>,
  ): Promise<Report>;
}
