import type { ItemsProviderPort } from '../../core/port/ItemsProviderPort.ts';
import type { LlmPort } from '../../core/port/LlmPort.ts';
import type { PersistencePort } from '../../core/port/PersistencePort.ts';
import {
  DEFAULT_WEIGHTS_OPTIONS,
  MomentumWeightsService,
} from '../../core/service/weights/MomentumWeightsService.ts';
import { Agent } from './Agent.ts';

export function makeAgent(
  items: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): Agent {
  const weights = new MomentumWeightsService(DEFAULT_WEIGHTS_OPTIONS);
  return new Agent(items, llm, persistence, weights);
}
