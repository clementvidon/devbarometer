import type { RelevantItem, WeightedItem } from '../../../domain/entities';
import type {
  ComputeMomentumWeightsPort,
  MomentumWeightsOptions,
} from '../../ports/pipeline/ComputeMomentumWeightsPort';
import { computeMomentumWeights as computeMomentumWeightsUsecase } from './computeMomentumWeights';

export class LocalComputeMomentumWeightsStep
  implements ComputeMomentumWeightsPort
{
  async computeMomentumWeights(
    items: RelevantItem[],
    prevItems: RelevantItem[],
    opts?: MomentumWeightsOptions,
  ): Promise<WeightedItem[]> {
    return await computeMomentumWeightsUsecase(items, prevItems, opts);
  }
}
