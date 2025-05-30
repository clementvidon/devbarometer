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

export interface AverageSentiment {
  emotions: EmotionScores;
}

export interface Sentiment {
  postId: string;
  title: string;
  upvotes: number;
  emotions: EmotionScores;
}
