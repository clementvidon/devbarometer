type EmotionScores = Record<string, number>;

interface Sentiment {
  upvotes: number;
  emotions: EmotionScores;
}

export function compressSentiments(sentiments: Sentiment[]): {
  emotions: EmotionScores;
} {
  const totals: Record<string, number> = {};
  let totalWeight = 0;

  for (const sentiment of sentiments) {
    const weight = sentiment.upvotes;
    totalWeight += weight;

    for (const [emotion, score] of Object.entries(sentiment.emotions)) {
      if (!(emotion in totals)) {
        totals[emotion] = 0;
      }
      totals[emotion] += score * weight;
    }
  }

  const weightedAverages: EmotionScores = {};
  for (const [emotion, total] of Object.entries(totals)) {
    weightedAverages[emotion] = totalWeight > 0 ? total / totalWeight : 0;
  }

  return { emotions: weightedAverages };
}
