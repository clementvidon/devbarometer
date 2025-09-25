import {
  DEFAULT_WEIGHTS_OPTIONS,
  MomentumWeightsStrategy,
} from '../../core/domain/weights/MomentumWeightsStrategy.ts';
import type { AgentPort } from '../../core/port/AgentPort.ts';
import type { ItemsProviderPort } from '../../core/port/ItemsProviderPort.ts';
import type { LlmPort } from '../../core/port/LlmPort.ts';
import type { PersistencePort } from '../../core/port/PersistencePort.ts';
import { ReportingAgent } from './ReportingAgent.ts';

export function makeReportingAgent(
  items: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): AgentPort {
  const weights = new MomentumWeightsStrategy(DEFAULT_WEIGHTS_OPTIONS);
  return new ReportingAgent(items, llm, persistence, weights);
}
