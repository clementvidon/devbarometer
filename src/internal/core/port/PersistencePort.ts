import type { PipelineSnapshot } from '../types/PipelineSnapshot';

export interface PersistencePort {
  storeSnapshot(
    snapshot: Omit<PipelineSnapshot, 'id' | 'createdAt'>,
  ): Promise<void>;
  getSnapshots(): Promise<PipelineSnapshot[]>;
}
