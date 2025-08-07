export interface EmotionScores {
  anger: number;
  fear: number;
  trust: number;
  sadness: number;
  joy: number;
  disgust: number;
}

export interface TonalityScores {
  positive: number;
  negative: number;
  optimistic_anticipation: number;
  pessimistic_anticipation: number;
  positive_surprise: number;
  negative_surprise: number;
}

export interface AggregatedEmotionProfile {
  date: string;
  count: number;
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
