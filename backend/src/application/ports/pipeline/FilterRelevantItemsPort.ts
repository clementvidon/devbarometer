import type {
  Item,
  ItemRelevance,
  RelevantItem,
} from '../../../domain/entities';
import type { LlmRunOptions } from '../output/LlmPort';
import type { LoggerPort } from '../output/LoggerPort';

export interface RelevancePrefilterOptions {
  enabled: boolean;
  rejectTitleOnly: boolean;
  applyTitleBlocklist: boolean;
}

export interface RelevanceGateOptions {
  enabled: boolean;
  topicMin: number;
  genreMin: number;
}

export interface FilterRelevantItemsOptions {
  /** Prompt système utilisé pour la pertinence */
  prompt: string;
  /** Concurrence p-limit pour les appels LLM */
  concurrency: number;
  /** Options LLM finales (incluant le modèle) */
  llmOptions: LlmRunOptions & { model: string };
  /** Préfiltre déterministe sans LLM */
  prefilter: RelevancePrefilterOptions;
  /** Seuils post-LLM sur topicScore/genreScore */
  gates: RelevanceGateOptions;
}

export interface FilterRelevantItemsResult {
  relevantItems: RelevantItem[];
  itemsRelevance: ItemRelevance[];
}

/**
 * Filter relevant items for the pipeline.
 *
 * Contract (interface-wide):
 * - Inputs are read-only; `items` may be empty; order is preserved in output.
 * - Output is a subset of `items` (no new items); each output item must come from the input.
 * - May perform external I/O (e.g. LLM calls) and log via the provided logger.
 */
export interface FilterRelevantItemsPort {
  /** Returns the items deemed relevant for downstream pipeline steps. */
  filterRelevantItems(
    logger: LoggerPort,
    items: Item[],
    opts?: Partial<FilterRelevantItemsOptions>,
  ): Promise<FilterRelevantItemsResult>;
}
