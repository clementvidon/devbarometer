import type {
  AggregatedEmotionProfile,
  EmotionProfile,
} from '../../core/entity/EmotionProfile';
import type { Item, RelevantItem, WeightedItem } from '../../core/entity/Item';
import type { Report } from '../entity/Report';

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
