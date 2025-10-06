import type {
  AggregatedEmotionProfile,
  EmotionProfile,
  Item,
  RelevantItem,
  Report,
  WeightedItem,
} from '../../core/entity';

export type PipelineSnapshot = {
  id: string;
  createdAt: string;
  fetchLabel: string;
  items: Item[];
  relevantItems: RelevantItem[];
  weightedItems: WeightedItem[];
  emotionProfilePerItem: EmotionProfile[];
  aggregatedEmotionProfile: AggregatedEmotionProfile;
  report: Report;
};

export type SnapshotData = Omit<PipelineSnapshot, 'id' | 'createdAt'>;
