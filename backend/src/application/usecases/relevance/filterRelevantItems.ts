import pLimit from 'p-limit';

import type { Item, RelevantItem } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { FilterRelevantItemsOptions } from '../../ports/pipeline/FilterRelevantItemsPort';
import { isRelevant } from './isRelevant';
import { CONCURRENCY, RELEVANCE_LLM_OPTIONS } from './policy';
import { relevanceFilterPrompt } from './prompts';

const DEFAULT_FILTER_RELEVANT_ITEMS_OPTIONS = {
  prompt: relevanceFilterPrompt,
  concurrency: CONCURRENCY,
  llmOptions: RELEVANCE_LLM_OPTIONS,
} satisfies FilterRelevantItemsOptions;

function mergeFilterRelevantItemsOptions(
  opts: Partial<FilterRelevantItemsOptions> = {},
): FilterRelevantItemsOptions {
  const mergedLlmOptions = {
    ...DEFAULT_FILTER_RELEVANT_ITEMS_OPTIONS.llmOptions,
    ...(opts.llmOptions ?? {}),
  };
  return {
    ...DEFAULT_FILTER_RELEVANT_ITEMS_OPTIONS,
    ...opts,
    llmOptions: mergedLlmOptions,
  };
}

type LabeledItem = { item: Item; ok: boolean };

export async function filterRelevantItems(
  logger: LoggerPort,
  items: Item[],
  llm: LlmPort,
  opts: Partial<FilterRelevantItemsOptions> = {},
): Promise<RelevantItem[]> {
  logger.info('Start relevance filter', { total: items.length });
  if (items.length === 0) {
    logger.info('End relevance filter', {
      total: 0,
      relevant: 0,
      discarded: 0,
    });
    return [];
  }

  const { prompt, concurrency, llmOptions } =
    mergeFilterRelevantItemsOptions(opts);

  const limit = pLimit(concurrency);
  const { model, ...runOpts } = llmOptions;

  const labeledItems: LabeledItem[] = await Promise.all(
    items.map((item) =>
      limit(async () => {
        const ok = await isRelevant(logger, item, llm, {
          prompt,
          model,
          runOpts,
        });
        return { item, ok };
      }),
    ),
  );

  const relevantItems = labeledItems.filter((r) => r.ok).map((r) => r.item);

  logger.info('End relevance filter', {
    total: items.length,
    relevant: relevantItems.length,
    discarded: items.length - relevantItems.length,
  });

  return relevantItems;
}
