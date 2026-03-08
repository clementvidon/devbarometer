import type { ReportingAgentPort } from '../../ports/input/ReportingAgentPort';
import type { ItemsProviderPort } from '../../ports/output/ItemsProviderPort';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { PersistencePort } from '../../ports/output/PersistencePort';

import type { ComputeMomentumWeightsPort } from '../../ports/pipeline/ComputeMomentumWeightsPort';
import type { CreateProfilesPort } from '../../ports/pipeline/CreateProfilesPort';
import type { CreateReportPort } from '../../ports/pipeline/CreateReportPort';
import type { FilterRelevantItemsPort } from '../../ports/pipeline/FilterRelevantItemsPort';

import { LlmCreateProfilesStep } from '../profiles/LlmCreateProfilesStep';
import { LlmFilterRelevantItemsStep } from '../relevance/LlmFilterRelevantItemsStep';
import { LlmCreateReportStep } from '../report/LlmCreateReportStep';
import { LocalComputeMomentumWeightsStep } from '../weights/LocalComputeMomentumWeightsStep';
import { ReportingAgentService } from './ReportingAgentService';

type PipelineOverrides = Partial<{
  relevance: FilterRelevantItemsPort;
  weights: ComputeMomentumWeightsPort;
  profiles: CreateProfilesPort;
  report: CreateReportPort;
}>;

export function makeReportingAgentService(
  logger: LoggerPort,
  items: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
  overrides: PipelineOverrides = {},
): ReportingAgentPort {
  const relevance = overrides.relevance ?? new LlmFilterRelevantItemsStep(llm);
  const weights = overrides.weights ?? new LocalComputeMomentumWeightsStep();
  const profiles = overrides.profiles ?? new LlmCreateProfilesStep(llm);
  const report = overrides.report ?? new LlmCreateReportStep(llm);

  return new ReportingAgentService(
    logger,
    items,
    persistence,
    relevance,
    weights,
    profiles,
    report,
  );
}
