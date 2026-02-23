import type { ReportingAgentPort } from '../../ports/input/ReportingAgentPort';
import type { ItemsProviderPort } from '../../ports/output/ItemsProviderPort';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type { PersistencePort } from '../../ports/output/PersistencePort';

import type { ComputeWeightsPort } from '../../ports/pipeline/ComputeWeightsPort';
import type { CreateProfilesPort } from '../../ports/pipeline/CreateProfilesPort';
import type { CreateReportPort } from '../../ports/pipeline/CreateReportPort';
import type { FilterRelevantItemsPort } from '../../ports/pipeline/FilterRelevantItemsPort';

import { LlmCreateProfilesStep } from '../profiles/LlmCreateProfilesStep';
import { LlmFilterRelevantItemsStep } from '../relevance/LlmFilterRelevantItemsStep';
import { LlmCreateReportStep } from '../report/LlmCreateReportStep';
import { MomentumComputeWeightsStep } from '../weights/MomentumComputeWeightsStep';
import { ReportingAgentService } from './ReportingAgentService';

type PipelineOverrides = Partial<{
  relevance: FilterRelevantItemsPort;
  weights: ComputeWeightsPort;
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
  const weights = overrides.weights ?? new MomentumComputeWeightsStep();
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
