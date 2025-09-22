import {
  DEFAULT_WEIGHTS_OPTIONS,
  MomentumWeightsAdapter,
} from '../../adapter/driven/weights/MomentumWeightsAdapter.ts';
import type { ItemsProviderPort } from '../port/ItemsProviderPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import { Agent } from './Agent.ts';

export function makeCoreAgent(
  itemsProvider: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): Agent {
  const weights = new MomentumWeightsAdapter(DEFAULT_WEIGHTS_OPTIONS);
  return new Agent(itemsProvider, llm, persistence, weights);
}
