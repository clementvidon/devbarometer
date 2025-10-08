import {
  DEFAULT_WEIGHTS_OPTIONS,
  MomentumWeightsStrategy,
} from '../../../domain/services/weights/MomentumWeightsStrategy';
import type { AgentPort } from '../../../internal/core/port/AgentPort';
import type { ItemsProviderPort } from '../../../internal/core/port/ItemsProviderPort';
import type { LlmPort } from '../../../internal/core/port/LlmPort';
import type { PersistencePort } from '../../../internal/core/port/PersistencePort';
import { ReportingAgent } from './ReportingAgent';

export function makeReportingAgent(
  items: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): AgentPort {
  const weights = new MomentumWeightsStrategy(DEFAULT_WEIGHTS_OPTIONS);
  return new ReportingAgent(items, llm, persistence, weights);
}
