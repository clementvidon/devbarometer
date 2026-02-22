import type { ReportingAgentPort } from '../../ports/input/ReportingAgentPort';
import type { ItemsProviderPort } from '../../ports/output/ItemsProviderPort';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { PersistencePort } from '../../ports/output/PersistencePort';
import { MomentumComputeWeightsStep } from '../weights/MomentumComputeWeightsStep';
import { ReportingAgentService } from './ReportingAgentService';

export function makeReportingAgentService(
  logger: LoggerPort,
  items: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): ReportingAgentPort {
  const weights = new MomentumComputeWeightsStep();
  return new ReportingAgentService(logger, items, llm, persistence, weights);
}
