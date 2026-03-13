import type { Item, ItemRelevance } from '../../../domain/entities';
import type { LlmPort, LlmRunOptions } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { makeRelevanceMessages } from './llmMessages';
import { parseRelevance } from './parseRelevance';
import { FALLBACK_ITEM_RELEVANCE } from './policy';

export async function analyzeOneItemRelevance(
  logger: LoggerPort,
  item: Item,
  llm: LlmPort,
  options: {
    prompt: string;
    model: string;
    runOpts: LlmRunOptions;
  },
): Promise<ItemRelevance> {
  try {
    const raw = await llm.run(
      options.model,
      makeRelevanceMessages(item, options.prompt),
      options.runOpts,
    );
    const res = parseRelevance(raw);
    if (res.ok) {
      return {
        itemRef: item.itemRef,
        ...res.value,
      };
    }

    logger.warn('Invalid LLM relevance output, using default', {
      reason: res.reason,
      itemTitle: item.title,
      itemRef: item.itemRef,
    });
    return {
      itemRef: item.itemRef,
      ...FALLBACK_ITEM_RELEVANCE,
    };
  } catch (err) {
    logger.warn('Failed to analyze relevance for item', {
      error: err instanceof Error ? err : String(err),
      itemTitle: item.title,
      itemRef: item.itemRef,
    });
    return {
      itemRef: item.itemRef,
      ...FALLBACK_ITEM_RELEVANCE,
    };
  }
}
