import type { Item } from '../../../domain/entities';
import type { LlmPort, LlmRunOptions } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import { makeRelevanceMessages } from './llmMessages';
import { parseRelevanceRaw } from './parseRelevance';
import { DEFAULT_RELEVANCE_ON_ERROR } from './policy';

export async function isRelevant(
  logger: LoggerPort,
  item: Item,
  llm: LlmPort,
  options: {
    prompt: string;
    model: string;
    runOpts: LlmRunOptions;
  },
): Promise<boolean> {
  try {
    const raw = await llm.run(
      options.model,
      makeRelevanceMessages(item, options.prompt),
      options.runOpts,
    );
    return parseRelevanceRaw(raw);
  } catch (err) {
    logger.warn('Failed to check relevance for item', {
      error: err instanceof Error ? err : String(err),
      itemTitle: item.title,
      itemSource: item.source,
    });
    return DEFAULT_RELEVANCE_ON_ERROR;
  }
}
