import type {
  EmotionScores,
  TonalityScores,
} from '@devbarometer/shared/domain';

export type { EmotionScores, TonalityScores };

export interface SentimentProfile {
  itemRef: string;
  emotions: EmotionScores;
  tonalities: TonalityScores;
  status: 'ok' | 'fallback';
}

export interface WeightedSentimentProfile extends SentimentProfile {
  weight: number;
}
