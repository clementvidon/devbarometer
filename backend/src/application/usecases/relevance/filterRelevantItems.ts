import pLimit from 'p-limit';
import type { Item, RelevantItem } from '../../../domain/entities';
import type { LlmPort, LlmRunOptions } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { makeRelevanceMessages } from './messages';
import { parseRelevanceResult } from './parseResult';
import {
  CONCURRENCY,
  DEFAULT_LLM_OPTIONS,
  DEFAULT_RELEVANCE_ON_ERROR,
} from './policy';
import { relevanceFilterPrompt } from './prompts';

export interface FilterRelevantItemsOptions {
  /** Prompt système utilisé pour la pertinence */
  prompt: string;
  /** Concurrence p-limit pour les appels LLM */
  concurrency: number;
  /** Options LLM finales (incluant le modèle) */
  llmOptions: LlmRunOptions & { model: string };
}

export const DEFAULT_FILTER_RELEVANT_ITEMS_OPTIONS = {
  prompt: relevanceFilterPrompt,
  concurrency: CONCURRENCY,
  llmOptions: DEFAULT_LLM_OPTIONS,
} as const satisfies FilterRelevantItemsOptions;

/** Note: per‑call partial overrides of llmOptions currently drop defaults (shallow merge). */
function mergeFilterRelevantItemsOptions(
  opts: Partial<FilterRelevantItemsOptions> = {},
): FilterRelevantItemsOptions {
  return { ...DEFAULT_FILTER_RELEVANT_ITEMS_OPTIONS, ...opts };
}

async function isRelevant(
  logger: LoggerPort,
  item: Item,
  llm: LlmPort,
  prompt: string,
  model: string,
  runOpts: LlmRunOptions,
): Promise<boolean> {
  try {
    const raw = await llm.run(
      model,
      makeRelevanceMessages(item, prompt),
      runOpts,
    );
    return parseRelevanceResult(raw);
  } catch (err) {
    logger.warn('Failed to check relevance for item', {
      error: err instanceof Error ? err : String(err),
      itemTitle: item.title,
      itemSource: item.source,
    });
    return DEFAULT_RELEVANCE_ON_ERROR;
  }
}

type LabeledItem = { item: Item; ok: boolean };

export async function filterRelevantItems(
  logger: LoggerPort,
  items: Item[],
  llm: LlmPort,
  opts: Partial<FilterRelevantItemsOptions> = {},
): Promise<RelevantItem[]> {
  const log = logger.child({
    module: 'relevance.filter',
  });

  log.info('Start relevance filter', { total: items.length });
  if (items.length === 0) return [];

  const { prompt, concurrency, llmOptions } =
    mergeFilterRelevantItemsOptions(opts);

  const limit = pLimit(concurrency);
  const { model, ...runOpts } = llmOptions;

  const labeledItems: LabeledItem[] = await Promise.all(
    items.map((item) =>
      limit(async () => {
        const ok = await isRelevant(log, item, llm, prompt, model, runOpts);
        return { item, ok };
      }),
    ),
  );

  const relevantItems = labeledItems.filter((r) => r.ok).map((r) => r.item);

  log.info('End relevance filter', {
    total: items.length,
    relevant: relevantItems.length,
    discarded: items.length - relevantItems.length,
  });

  return relevantItems;
}
