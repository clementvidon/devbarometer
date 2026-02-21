import {
  type AggregatedEmotionProfile,
  type Report,
} from '../../../domain/entities';
import type { LlmPort, LlmRunOptions } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { makeReportMessages } from './llmMessages';
import { parseReportRaw } from './parseReport';
import { FALLBACK_REPORT, REPORT_LLM_OPTIONS } from './policy';
import { reportPrompt } from './prompts';
import { summarizeProfile } from './summarizeProfile';

interface CreateReportOptions {
  /** System prompt for report generation */
  reportPrompt: string;
  /** Standard LLM Options (including the model) */
  llmOptions: LlmRunOptions & { model: string };
}

const DEFAULT_CREATE_REPORT_OPTIONS = {
  reportPrompt: reportPrompt,
  llmOptions: REPORT_LLM_OPTIONS,
} as const satisfies CreateReportOptions;

/** Note: per‑call partial overrides of llmOptions currently drop defaults (shallow merge). */
function mergeCreateReportOptions(
  opts: Partial<CreateReportOptions> = {},
): CreateReportOptions {
  return { ...DEFAULT_CREATE_REPORT_OPTIONS, ...opts };
}

export async function createReport(
  logger: LoggerPort,
  aggregatedEmotionProfile: AggregatedEmotionProfile,
  llm: LlmPort,
  opts: Partial<CreateReportOptions> = {},
): Promise<Report> {
  const log = logger.child({ module: 'profiles.report' });

  const { reportPrompt, llmOptions } = mergeCreateReportOptions(opts);

  const { model, ...runOpts } = llmOptions;

  try {
    const summary = summarizeProfile(aggregatedEmotionProfile);
    log.debug('Summarized profile', { summary });
    const raw = await llm.run(
      model,
      makeReportMessages(summary, reportPrompt),
      runOpts,
    );

    log.info('LLM call succeeded', { model: 'gpt-5-chat-latest' });

    const report = parseReportRaw(raw);
    const hasFailed = report === FALLBACK_REPORT;

    if (hasFailed) {
      log.warn('LLM output invalid, using fallback');
      return FALLBACK_REPORT;
    }

    log.info('Report parsed successfully');
    return report;
  } catch (err) {
    log.error('LLM call failed, using fallback', { error: err });
    return FALLBACK_REPORT;
  }
}
