import type { Item } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type {
  FilterRelevantItemsOptions,
  FilterRelevantItemsResult,
} from '../../ports/pipeline/FilterRelevantItemsPort';
import { analyzeItemsRelevance } from './analyzeItemsRelevance';
import { selectRelevantItems } from './selectRelevantItems';

export async function filterRelevantItems(
  logger: LoggerPort,
  items: Item[],
  llm: LlmPort,
  opts: Partial<FilterRelevantItemsOptions> = {},
): Promise<FilterRelevantItemsResult> {
  logger.info('Start relevance filter', { total: items.length });
  if (items.length === 0) {
    logger.info('End relevance filter', {
      total: 0,
      relevant: 0,
      discarded: 0,
    });
    return { relevantItems: [], itemsRelevance: [] };
  }

  const itemsRelevance = await analyzeItemsRelevance(logger, items, llm, opts);
  const relevantItems = selectRelevantItems(items, itemsRelevance);

  logger.info('End relevance filter', {
    total: items.length,
    relevant: relevantItems.length,
    discarded: items.length - relevantItems.length,
  });

  return { relevantItems, itemsRelevance };
}
