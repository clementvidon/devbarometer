import type { AggregatedEmotionProfile } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type {
  CreateReportOptions,
  CreateReportPort,
} from '../../ports/pipeline/CreateReportPort';
import { createReport as createReportUsecase } from './createReport';

export class LlmCreateReportStep implements CreateReportPort {
  constructor(private readonly llm: LlmPort) {}

  async createReport(
    logger: LoggerPort,
    aggregatedEmotionProfile: AggregatedEmotionProfile,
    opts?: Partial<CreateReportOptions>,
  ) {
    return await createReportUsecase(
      logger.child({ scope: 'report.create' }),
      aggregatedEmotionProfile,
      this.llm,
      opts,
    );
  }
}
