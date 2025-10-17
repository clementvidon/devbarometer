import pLimit from 'p-limit';
import type { Item, RelevantItem } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import { makeRelevanceMessages } from './messages';
import { parseRelevanceResult } from './parseResult';
import { CONCURRENCY, DEFAULT_LLM_OPTIONS } from './policy';
import { relevanceFilterPrompt } from './prompts';

export interface FilterRelevantItemsOptions {
  /** Prompt système utilisé pour la pertinence */
  prompt: string;
  /** Concurrence p-limit pour les appels LLM */
  concurrency: number;
  /** Options LLM finales (incluant le modèle) */
  llmOptions: typeof DEFAULT_LLM_OPTIONS;
}

export const DEFAULT_FILTER_RELEVANT_ITEMS_OPTIONS = {
  prompt: relevanceFilterPrompt,
  concurrency: CONCURRENCY,
  llmOptions: DEFAULT_LLM_OPTIONS,
} as const satisfies FilterRelevantItemsOptions;

function mergeFilterRelevantItemsOptions(
  opts: Partial<FilterRelevantItemsOptions> = {},
): FilterRelevantItemsOptions {
  return { ...DEFAULT_FILTER_RELEVANT_ITEMS_OPTIONS, ...opts };
}

async function isRelevant(
  item: Item,
  llm: LlmPort,
  prompt: string,
  model: string,
  runOpts: Omit<typeof DEFAULT_LLM_OPTIONS, 'model'>,
): Promise<boolean> {
  try {
    const raw = await llm.run(
      model,
      makeRelevanceMessages(item, prompt),
      runOpts,
    );
    return parseRelevanceResult(raw);
  } catch (err) {
    console.error(
      `[filterRelevantItems] Failed to check relevance for item "${item.title}"`,
      err,
    );
    return false;
  }
}

export async function filterRelevantItems(
  items: Item[],
  llm: LlmPort,
  opts: Partial<FilterRelevantItemsOptions> = {},
): Promise<RelevantItem[]> {
  if (items.length === 0) {
    console.error('[filterRelevantItems] Received empty items array.');
    return [];
  }

  const { prompt, concurrency, llmOptions } =
    mergeFilterRelevantItemsOptions(opts);

  const limit = pLimit(concurrency);
  const { model, ...runOpts } = llmOptions;

  const labeledItems = await Promise.all(
    items.map((item) =>
      limit(async () => ({
        item,
        ok: await isRelevant(item, llm, prompt, model, runOpts),
      })),
    ),
  );

  const relevantItems = labeledItems.filter((r) => r.ok).map((r) => r.item);

  if (relevantItems.length === 0) {
    console.error('[filterRelevantItems] No relevant items identified.');
  }

  return relevantItems;
}
