import type {
  EmotionScores as SharedEmotionScores,
  TonalityScores as SharedTonalityScores,
} from '@devbarometer/shared';

export type EmotionScores = SharedEmotionScores;
export type TonalityScores = SharedTonalityScores;

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
