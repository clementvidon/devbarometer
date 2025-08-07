export interface EmotionScores {
  anger: number;
  fear: number;
  anticipation: number;
  trust: number;
  surprise: number;
  sadness: number;
  joy: number;
  disgust: number;
  negative: number;
  positive: number;
}

export interface AverageEmotionProfile {
  emotions: EmotionScores;
}

export interface EmotionProfile {
  postId: string;
  title: string;
  upvotes: number;
  emotions: EmotionScores;
}
