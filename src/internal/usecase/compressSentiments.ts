import type {
  Sentiment,
  AverageSentiment,
  EmotionScores,
} from '../core/entity/Sentiment';

export function compressSentiments(sentiments: Sentiment[]): AverageSentiment {
  if (sentiments.length === 0) {
    throw new Error('No sentiments to compress – possible pipeline failure');
  }
  const totals: EmotionScores = {
    anger: 0,
    fear: 0,
    anticipation: 0,
    trust: 0,
    surprise: 0,
    sadness: 0,
    joy: 0,
    disgust: 0,
    negative: 0,
    positive: 0,
  };
  let weightSum = 0;
  for (const s of sentiments) {
    const weight = s.upvotes;
    weightSum += weight;
    type EmotionKey = keyof EmotionScores;
    (Object.keys(totals) as EmotionKey[]).forEach((key) => {
      totals[key] += s.emotions[key] * weight;
    });
  }
  const averages: EmotionScores = { ...totals };
  for (const key in averages) {
    averages[key as keyof EmotionScores] =
      weightSum > 0 ? averages[key as keyof EmotionScores] / weightSum : 0;
  }
  return {
    emotions: averages,
    timestamp: new Date().toISOString(),
  };
}
