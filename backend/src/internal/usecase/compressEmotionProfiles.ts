import type {
  AverageEmotionProfile,
  EmotionProfile,
  EmotionScores,
} from '../core/entity/EmotionProfile.ts';

export function compressEmotionProfiles(
  sentiments: EmotionProfile[],
): AverageEmotionProfile {
  const totals = {
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
  } satisfies EmotionScores;

  if (sentiments.length === 0) {
    console.error('[compressEmotionProfiles] No sentiments provided.');
    const noEmotionScores: EmotionScores = { ...totals };
    return { emotions: noEmotionScores };
  }

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
  return { emotions: averages };
}
