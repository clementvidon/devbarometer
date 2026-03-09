import type {
  EmotionScores,
  TonalityScores,
} from '@devbarometer/shared/domain';

export type { EmotionScores, TonalityScores };

export interface EmotionProfile {
  title: string;
  itemRef: string;
  weight: number;
  emotions: EmotionScores;
  tonalities: TonalityScores;
}
