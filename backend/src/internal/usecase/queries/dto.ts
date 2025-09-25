import type { AggregatedEmotionProfile } from '../../core/entity/EmotionProfile';

export interface AggregatedEmotionProfileDto extends AggregatedEmotionProfile {
  createdAt: string;
}
