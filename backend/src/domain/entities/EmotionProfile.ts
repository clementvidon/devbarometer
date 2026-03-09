import type {
  EmotionScores,
  TonalityScores,
} from '@devbarometer/shared/domain';

export type { EmotionScores, TonalityScores };

export interface EmotionProfile {
  itemRef: string;
  emotions: EmotionScores;
  tonalities: TonalityScores;
  status: 'ok' | 'fallback';
}

export interface WeightedEmotionProfile extends EmotionProfile {
  weight: number;
}
