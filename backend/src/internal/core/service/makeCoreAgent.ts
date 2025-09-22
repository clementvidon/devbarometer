import type { ItemsProviderPort } from '../port/ItemsProviderPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import { Agent } from './Agent.ts';
import {
  DEFAULT_WEIGHTS_OPTIONS,
  MomentumWeightsService,
} from './weights/MomentumWeightsService.ts';

export function makeCoreAgent(
  itemsProvider: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): Agent {
  const weights = new MomentumWeightsService(DEFAULT_WEIGHTS_OPTIONS);
  return new Agent(itemsProvider, llm, persistence, weights);
}
