import {
  DEFAULT_WEIGHTS_OPTIONS,
  MomentumWeightsStrategy,
} from '../../../domain/services/weights/MomentumWeightsStrategy';
import type { ReportingAgentPort } from '../../ports/input/ReportingAgentPort';
import type { ItemsProviderPort } from '../../ports/output/ItemsProviderPort';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { PersistencePort } from '../../ports/output/PersistencePort';
import { ReportingAgentService } from './ReportingAgentService';

export function makeReportingAgentService(
  items: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): ReportingAgentPort {
  const weights = new MomentumWeightsStrategy(DEFAULT_WEIGHTS_OPTIONS);
  return new ReportingAgentService(items, llm, persistence, weights);
}
