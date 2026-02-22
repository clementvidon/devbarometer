import type { RelevantItem, WeightedItem } from '../../../domain/entities';
import type {
  ComputeWeightsPort,
  MomentumWeightsOptions,
} from '../../ports/pipeline/ComputeWeightsPort';
import { computeWeights as computeWeightsUsecase } from './computeWeights';

export class MomentumComputeWeightsStep implements ComputeWeightsPort {
  async computeWeights(
    items: RelevantItem[],
    prevItems: RelevantItem[],
    opts?: MomentumWeightsOptions,
  ): Promise<WeightedItem[]> {
    return await computeWeightsUsecase(items, prevItems, opts);
  }
}
