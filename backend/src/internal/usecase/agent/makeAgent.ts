import {
  DEFAULT_WEIGHTS_OPTIONS,
  MomentumWeightsStrategy,
} from '../../core/domain/weights/MomentumWeightsStrategy.ts';
import type { ItemsProviderPort } from '../../core/port/ItemsProviderPort.ts';
import type { LlmPort } from '../../core/port/LlmPort.ts';
import type { PersistencePort } from '../../core/port/PersistencePort.ts';
import { Agent } from './Agent.ts';

export function makeAgent(
  items: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): Agent {
  const weights = new MomentumWeightsStrategy(DEFAULT_WEIGHTS_OPTIONS);
  return new Agent(items, llm, persistence, weights);
}
