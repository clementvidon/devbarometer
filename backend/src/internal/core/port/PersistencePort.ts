import type { PipelineSnapshot } from '../types/PipelineSnapshot.ts';

export interface PersistencePort {
  storeSnapshot(
    _snapshot: Omit<PipelineSnapshot, 'id' | 'createdAt'>,
  ): Promise<void>;
  getSnapshots(): Promise<PipelineSnapshot[]>;
}
