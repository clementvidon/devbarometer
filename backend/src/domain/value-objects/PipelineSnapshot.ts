import type {
  AggregatedEmotionProfile,
  Item,
  Report,
  WeightedEmotionProfile,
  WeightedItem,
} from '../entities';

export type PipelineSnapshot = {
  id: string;
  createdAt: string;
  fetchRef: string;
  inputItems: Item[];
  weightedItems: WeightedItem[];
  weightedEmotionProfiles: WeightedEmotionProfile[];
  aggregatedEmotionProfile: AggregatedEmotionProfile;
  report: Report;
};

export type SnapshotData = Omit<PipelineSnapshot, 'id' | 'createdAt'>;
