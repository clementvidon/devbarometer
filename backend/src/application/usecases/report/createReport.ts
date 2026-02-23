import {
  type AggregatedEmotionProfile,
  type Report,
} from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { CreateReportOptions } from '../../ports/pipeline/CreateReportPort';
import { makeReportMessages } from './llmMessages';
import { parseReportRaw } from './parseReport';
import { FALLBACK_REPORT, REPORT_LLM_OPTIONS } from './policy';
import { reportPrompt } from './prompts';
import { summarizeProfile } from './summarizeProfile';

const DEFAULT_CREATE_REPORT_OPTIONS = {
  reportPrompt: reportPrompt,
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
  aggregatedEmotionProfile: AggregatedEmotionProfile,
  llm: LlmPort,
  opts: Partial<CreateReportOptions> = {},
): Promise<Report> {
  const { reportPrompt, llmOptions } = mergeCreateReportOptions(opts);

  const { model, ...runOpts } = llmOptions;

  try {
    const summary = summarizeProfile(aggregatedEmotionProfile);
    logger.debug('Summarized profile', { summary });
    const raw = await llm.run(
      model,
      makeReportMessages(summary, reportPrompt),
      runOpts,
    );

    logger.info('LLM call succeeded', { model: 'gpt-5-chat-latest' });

    const report = parseReportRaw(raw);
    const hasFailed = report === FALLBACK_REPORT;

    if (hasFailed) {
      logger.warn('LLM output invalid, using fallback');
      return FALLBACK_REPORT;
    }

    logger.info('Report parsed successfully');
    return report;
  } catch (err) {
    logger.error('LLM call failed, using fallback', { error: err });
    return FALLBACK_REPORT;
  }
}
