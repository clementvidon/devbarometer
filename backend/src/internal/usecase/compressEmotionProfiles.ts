import type {
  AggregatedEmotionProfile,
  EmotionProfile,
  EmotionScores,
  TonalityScores,
} from '../core/entity/EmotionProfile.ts';

export function compressEmotionProfiles(
  profiles: EmotionProfile[],
): AggregatedEmotionProfile {
  const emotionTotals: EmotionScores = {
    anger: 0,
    fear: 0,
    trust: 0,
    sadness: 0,
    joy: 0,
    disgust: 0,
  };

  const tonalityTotals: TonalityScores = {
    positive: 0,
    negative: 0,
    optimistic_anticipation: 0,
    pessimistic_anticipation: 0,
    positive_surprise: 0,
    negative_surprise: 0,
  };

  if (profiles.length === 0) {
    console.error('[compressEmotionProfiles] No profiles provided.');
    return {
      date: new Date().toISOString().slice(0, 10),
      count: 0,
      emotions: { ...emotionTotals },
      tonalities: { ...tonalityTotals },
    };
  }

  let weightSum = 0;

  for (const profile of profiles) {
    const { weight, emotions, tonalities } = profile;
    weightSum += weight;

    for (const key in emotionTotals) {
      emotionTotals[key as keyof EmotionScores] +=
        emotions[key as keyof EmotionScores] * weight;
    }

    for (const key in tonalityTotals) {
      tonalityTotals[key as keyof TonalityScores] +=
        tonalities[key as keyof TonalityScores] * weight;
    }
  }

  const averagedEmotions: EmotionScores = { ...emotionTotals };
  const averagedTonalities: TonalityScores = { ...tonalityTotals };

  for (const key in averagedEmotions) {
    averagedEmotions[key as keyof EmotionScores] =
      weightSum > 0
        ? averagedEmotions[key as keyof EmotionScores] / weightSum
        : 0;
  }

  for (const key in averagedTonalities) {
    averagedTonalities[key as keyof TonalityScores] =
      weightSum > 0
        ? averagedTonalities[key as keyof TonalityScores] / weightSum
        : 0;
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    count: profiles.length,
    emotions: averagedEmotions,
    tonalities: averagedTonalities,
  };
}
