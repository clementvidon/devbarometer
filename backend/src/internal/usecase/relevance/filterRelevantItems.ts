import pLimit from 'p-limit';
import type { Item, RelevantItem } from '../../core/entity/Item.ts';
import type { LlmPort } from '../../core/port/LlmPort.ts';
import { makeRelevanceMessages } from './messages.ts';
import { parseRelevanceResult } from './parseResult.ts';
import { CONCURRENCY, DEFAULT_LLM_OPTIONS } from './policy.ts';
import { relevanceFilterPrompt } from './prompts.ts';

async function isRelevant(
  item: Item,
  llm: LlmPort,
  prompt: string,
): Promise<boolean> {
  try {
    const raw = await llm.run(
      DEFAULT_LLM_OPTIONS.model,
      makeRelevanceMessages(item, prompt),
      DEFAULT_LLM_OPTIONS,
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
  prompt: string = relevanceFilterPrompt,
): Promise<RelevantItem[]> {
  if (items.length === 0) {
    console.error('[filterRelevantItems] Received empty items array.');
    return [];
  }
  const limit = pLimit(CONCURRENCY);
  const labeledItems = await Promise.all(
    items.map((item) =>
      limit(async () => ({ item, ok: await isRelevant(item, llm, prompt) })),
    ),
  );

  const relevantItems = labeledItems.filter((r) => r.ok).map((r) => r.item);
  if (relevantItems.length === 0) {
    console.error('[filterRelevantItems] No relevant items identified.');
  }

  return relevantItems;
}
