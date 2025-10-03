import {
  DEFAULT_WEIGHTS_OPTIONS,
  MomentumWeightsStrategy,
} from '../../core/domain/weights/MomentumWeightsStrategy';
import type { AgentPort } from '../../core/port/AgentPort';
import type { ItemsProviderPort } from '../../core/port/ItemsProviderPort';
import type { LlmPort } from '../../core/port/LlmPort';
import type { PersistencePort } from '../../core/port/PersistencePort';
import { ReportingAgent } from './ReportingAgent';

export function makeReportingAgent(
  items: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): AgentPort {
  const weights = new MomentumWeightsStrategy(DEFAULT_WEIGHTS_OPTIONS);
  return new ReportingAgent(items, llm, persistence, weights);
}
