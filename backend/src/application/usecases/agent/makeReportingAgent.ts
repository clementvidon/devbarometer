import {
  DEFAULT_WEIGHTS_OPTIONS,
  MomentumWeightsStrategy,
} from '../../../domain/services/weights/MomentumWeightsStrategy';
import type { AgentPort } from '../../ports/AgentPort';
import type { ItemsProviderPort } from '../../ports/ItemsProviderPort';
import type { LlmPort } from '../../ports/LlmPort';
import type { PersistencePort } from '../../ports/PersistencePort';
import { ReportingAgent } from './ReportingAgent';

export function makeReportingAgent(
  items: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): AgentPort {
  const weights = new MomentumWeightsStrategy(DEFAULT_WEIGHTS_OPTIONS);
  return new ReportingAgent(items, llm, persistence, weights);
}
