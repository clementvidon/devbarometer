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

export interface EmotionProfile {
  title: string;
  source: string;
  weight: number;
  emotions: EmotionScores;
  tonalities: TonalityScores;
}
