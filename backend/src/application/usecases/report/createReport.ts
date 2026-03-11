import type { Report } from '@devbarometer/shared/domain';
import { type AggregatedSentimentProfile } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { CreateReportOptions } from '../../ports/pipeline/CreateReportPort';
import { makeReportMessages } from './llmMessages';
import { parseReport } from './parseReport';
import { FALLBACK_REPORT, REPORT_LLM_OPTIONS } from './policy';
import { reportPrompt } from './prompts';
import { summarizeProfile } from './summarizeProfile';

const DEFAULT_CREATE_REPORT_OPTIONS = {
  reportPrompt,
  llmOptions: REPORT_LLM_OPTIONS,
} satisfies CreateReportOptions;

function mergeCreateReportOptions(
  opts: Partial<CreateReportOptions> = {},
): CreateReportOptions {
  const mergedLlmOptions = {
    ...DEFAULT_CREATE_REPORT_OPTIONS.llmOptions,
    ...(opts.llmOptions ?? {}),
  };
  return {
    ...DEFAULT_CREATE_REPORT_OPTIONS,
    ...opts,
    llmOptions: mergedLlmOptions,
  };
}

export async function createReport(
  logger: LoggerPort,
  aggregatedProfile: AggregatedSentimentProfile,
  llm: LlmPort,
  opts: Partial<CreateReportOptions> = {},
): Promise<Report> {
  if (aggregatedProfile.count === 0) {
    logger.error('No aggregated profiles to report.');
    return FALLBACK_REPORT;
  }

  const { reportPrompt, llmOptions } = mergeCreateReportOptions(opts);

  const { model, ...runOpts } = llmOptions;

  try {
    const summary = summarizeProfile(aggregatedProfile);
    logger.debug('Summarized profile', { summary });
    const raw = await llm.run(
      model,
      makeReportMessages(summary, reportPrompt),
      runOpts,
    );

    const res = parseReport(raw);

    if (!res.ok) {
      logger.warn('LLM output invalid, using fallback', { reason: res.reason });
      return FALLBACK_REPORT;
    }

    return res.value;
  } catch (err) {
    logger.error('LLM call failed, using fallback', { error: err });
    return FALLBACK_REPORT;
  }
}
