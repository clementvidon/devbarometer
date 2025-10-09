import type {
  EmotionScores,
  TonalityScores,
} from '@devbarometer/shared/domain';

export type { EmotionScores, TonalityScores };

export interface AggregatedEmotionProfile {
  count: number;
  totalWeight: number;
  emotions: EmotionScores;
  tonalities: TonalityScores;
}
