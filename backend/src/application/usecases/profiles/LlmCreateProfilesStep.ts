import type { WeightedItem } from '../../../domain/entities';
import type { LlmPort } from '../../ports/output/LlmPort';
import type { LoggerPort } from '../../ports/output/LoggerPort';
import type {
  CreateProfilesOptions,
  CreateProfilesPort,
} from '../../ports/pipeline/CreateProfilesPort';
import { createProfiles as createProfilesUsecase } from './createProfiles';

export class LlmCreateProfilesStep implements CreateProfilesPort {
  constructor(private readonly llm: LlmPort) {}

  async createProfiles(
    logger: LoggerPort,
    items: WeightedItem[],
    opts?: Partial<CreateProfilesOptions>,
  ) {
    return await createProfilesUsecase(
      logger.child({ scope: 'profiles.create' }),
      items,
      this.llm,
      opts,
    );
  }
}
