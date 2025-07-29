import type { PipelineSnapshot } from '../types/PipelineSnapshot.ts';

export interface PersistencePort {
  storeSnapshot(
    this: void,
    _snapshot: Omit<PipelineSnapshot, 'id' | 'createdAt'>,
  ): Promise<void>;
  getSnapshots(this: void): Promise<PipelineSnapshot[]>;
}
