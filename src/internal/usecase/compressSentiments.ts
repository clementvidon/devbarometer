type EmotionScores = Record<string, number>;

interface Sentiment {
  upvotes: number;
  emotions: EmotionScores;
}

export function compressSentiments(sentiments: Sentiment[]): EmotionScores {
  const totals: Record<string, number> = {};
  let weightSum = 0;

  for (const s of sentiments) {
    const weight = s.upvotes;
    weightSum += weight;
    for (const [emotion, score] of Object.entries(s.emotions)) {
      if (!(emotion in totals)) {
        totals[emotion] = 0;
      }
      totals[emotion] += score * weight;
    }
  }

  const averages: EmotionScores = {};
  for (const [emotion, total] of Object.entries(totals)) {
    averages[emotion] = weightSum > 0 ? total / weightSum : 0;
  }

  return averages;
}
