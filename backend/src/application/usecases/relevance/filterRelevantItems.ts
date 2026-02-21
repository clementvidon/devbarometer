import pLimit from 'p-limit';
import type { Item, RelevantItem } from '../../../domain/entities';
import type { LlmPort, LlmRunOptions } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { isRelevant } from './isRelevant';
import { CONCURRENCY, RELEVANCE_LLM_OPTIONS } from './policy';
import { relevanceFilterPrompt } from './prompts';

interface FilterRelevantItemsOptions {
  /** Prompt système utilisé pour la pertinence */
  prompt: string;
  /** Concurrence p-limit pour les appels LLM */
  concurrency: number;
  /** Options LLM finales (incluant le modèle) */
  llmOptions: LlmRunOptions & { model: string };
}

const DEFAULT_FILTER_RELEVANT_ITEMS_OPTIONS = {
  prompt: relevanceFilterPrompt,
  concurrency: CONCURRENCY,
  llmOptions: RELEVANCE_LLM_OPTIONS,
} as const satisfies FilterRelevantItemsOptions;

/** Note: per‑call partial overrides of llmOptions currently drop defaults (shallow merge). */
function mergeFilterRelevantItemsOptions(
  opts: Partial<FilterRelevantItemsOptions> = {},
): FilterRelevantItemsOptions {
  return { ...DEFAULT_FILTER_RELEVANT_ITEMS_OPTIONS, ...opts };
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
  if (items.length === 0) {
    log.info('End relevance filter', {
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
        const ok = await isRelevant(log, item, llm, { prompt, model, runOpts });
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
