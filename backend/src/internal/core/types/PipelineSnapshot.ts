import type {
  AggregatedEmotionProfile,
  EmotionProfile,
} from '../../core/entity/EmotionProfile.ts';
import type { EmotionProfileReport } from '../../core/entity/EmotionProfileReport.ts';
import type { Item, RelevantItem } from '../../core/entity/Item.ts';

export type PipelineSnapshot = {
  id: string;
  createdAt: string;
  fetchLabel: string;
  items: Item[];
  relevantItems: RelevantItem[];
  weightedItems: RelevantItem[];
  emotionProfilePerItem: EmotionProfile[];
  aggregatedEmotionProfile: AggregatedEmotionProfile;
  report: EmotionProfileReport;
};

export type SnapshotData = Omit<PipelineSnapshot, 'id' | 'createdAt'>;
