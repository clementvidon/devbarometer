import type { Item, RelevantItem } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type {
  FilterRelevantItemsOptions,
  FilterRelevantItemsPort,
} from '../../ports/pipeline/FilterRelevantItemsPort';
import { filterRelevantItems as filterRelevantItemsUsecase } from './filterRelevantItems';

export class LlmFilterRelevantItemsStep implements FilterRelevantItemsPort {
  constructor(private readonly llm: LlmPort) {}

  async filterRelevantItems(
    logger: LoggerPort,
    items: Item[],
    opts?: FilterRelevantItemsOptions,
  ): Promise<RelevantItem[]> {
    return await filterRelevantItemsUsecase(
      logger.child({ scope: 'relevance.filter' }),
      items,
      this.llm,
      opts,
    );
  }
}
