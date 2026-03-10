import type {
  EmotionScores,
  TonalityScores,
} from '@devbarometer/shared/domain';

export type { EmotionScores, TonalityScores };

export interface AggregatedSentimentProfile {
  count: number;
  totalWeight: number;
  emotions: EmotionScores;
  tonalities: TonalityScores;
}
