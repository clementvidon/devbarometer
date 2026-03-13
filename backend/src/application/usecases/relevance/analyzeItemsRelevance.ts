import pLimit from 'p-limit';

import type { Item, ItemRelevance } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { FilterRelevantItemsOptions } from '../../ports/pipeline/FilterRelevantItemsPort';
import { analyzeOneItemRelevance } from './analyzeOneItemRelevance';
import {
  CONCURRENCY,
  FALLBACK_ITEM_RELEVANCE,
  RELEVANCE_LLM_OPTIONS,
} from './policy';
import { prefilterRelevance } from './prefilterRelevance';
import { relevanceFilterPrompt } from './prompts';

export const DEFAULT_RELEVANCE_PREFILTER_OPTIONS = {
  enabled: true,
  rejectTitleOnly: true,
  applyTitleBlocklist: true,
} as const;

const DEFAULT_ANALYZE_ITEMS_RELEVANCE_OPTIONS = {
  prompt: relevanceFilterPrompt,
  concurrency: CONCURRENCY,
  llmOptions: RELEVANCE_LLM_OPTIONS,
  prefilter: DEFAULT_RELEVANCE_PREFILTER_OPTIONS,
} satisfies FilterRelevantItemsOptions;

function mergeAnalyzeItemsRelevanceOptions(
  opts: Partial<FilterRelevantItemsOptions> = {},
): FilterRelevantItemsOptions {
  const mergedLlmOptions = {
    ...DEFAULT_ANALYZE_ITEMS_RELEVANCE_OPTIONS.llmOptions,
    ...(opts.llmOptions ?? {}),
  };
  const mergedPrefilter = {
    ...DEFAULT_ANALYZE_ITEMS_RELEVANCE_OPTIONS.prefilter,
    ...(opts.prefilter ?? {}),
  };
  return {
    ...DEFAULT_ANALYZE_ITEMS_RELEVANCE_OPTIONS,
    ...opts,
    llmOptions: mergedLlmOptions,
    prefilter: mergedPrefilter,
  };
}

export async function analyzeItemsRelevance(
  logger: LoggerPort,
  items: Item[],
  llm: LlmPort,
  opts: Partial<FilterRelevantItemsOptions> = {},
): Promise<ItemRelevance[]> {
  logger.info('Start relevance analysis', { total: items.length });

  if (items.length === 0) {
    logger.info('End relevance analysis', {
      total: 0,
      analyzed: 0,
      prefilterTitleOnlyDiscarded: 0,
      prefilterTitleBlocklistDiscarded: 0,
    });
    return [];
  }

  const { prompt, concurrency, llmOptions, prefilter } =
    mergeAnalyzeItemsRelevanceOptions(opts);

  const limit = pLimit(concurrency);
  const { model, ...runOpts } = llmOptions;
  let prefilterTitleOnlyDiscarded = 0;
  let prefilterTitleBlocklistDiscarded = 0;

  const itemsRelevance = await Promise.all(
    items.map((item) =>
      limit(async () => {
        const prefilterDecision = prefilterRelevance(item, prefilter);
        if (prefilterDecision.kind === 'reject') {
          if (prefilterDecision.reason === 'title_only') {
            prefilterTitleOnlyDiscarded++;
          } else {
            prefilterTitleBlocklistDiscarded++;
          }
          return {
            itemRef: item.itemRef,
            ...FALLBACK_ITEM_RELEVANCE,
          };
        }

        return analyzeOneItemRelevance(logger, item, llm, {
          prompt,
          model,
          runOpts,
        });
      }),
    ),
  );

  logger.info('End relevance analysis', {
    total: items.length,
    analyzed: itemsRelevance.length,
    relevant: itemsRelevance.filter((item) => item.relevant).length,
    prefilterTitleOnlyDiscarded,
    prefilterTitleBlocklistDiscarded,
  });

  return itemsRelevance;
}
