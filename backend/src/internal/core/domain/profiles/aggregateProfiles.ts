import type {
  AggregatedEmotionProfile,
  EmotionProfile,
  EmotionScores,
  TonalityScores,
} from '../../entity/EmotionProfile.ts';

export function aggregateProfiles(
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
    console.error('[aggregateProfiles] No profiles provided.');
    return {
      date: new Date().toISOString().slice(0, 10),
      count: 0,
      emotions: { ...emotionTotals },
      tonalities: { ...tonalityTotals },
      totalWeight: 0,
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

  const averagedEmotions = {} as EmotionScores;
  const emotionKeys = Object.keys(emotionTotals) as (keyof EmotionScores)[];
  for (const k of emotionKeys) {
    const total = emotionTotals[k] ?? 0;
    averagedEmotions[k] = weightSum > 0 ? total / weightSum : 0;
  }

  const averagedTonalities = {} as TonalityScores;
  const tonalityKeys = Object.keys(tonalityTotals) as (keyof TonalityScores)[];
  for (const k of tonalityKeys) {
    const total = tonalityTotals[k] ?? 0;
    averagedTonalities[k] = weightSum > 0 ? total / weightSum : 0;
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    count: profiles.length,
    emotions: averagedEmotions,
    tonalities: averagedTonalities,
    totalWeight: weightSum,
  };
}
