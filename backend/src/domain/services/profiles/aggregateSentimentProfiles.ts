import {
  EMOTION_SCORE_FIELDS,
  type EmotionScores,
  TONALITY_SCORE_FIELDS,
  type TonalityScores,
} from '@masswhisper/shared/domain';

import type {
  AggregatedSentimentProfile,
  WeightedSentimentProfile,
} from '../../entities';

export function aggregateSentimentProfiles(
  profiles: WeightedSentimentProfile[],
): AggregatedSentimentProfile {
  if (profiles.length === 0) {
    throw new Error('[aggregateSentimentProfiles] No profiles provided.');
  }

  const zeroEmotions = Object.fromEntries(
    EMOTION_SCORE_FIELDS.map((k) => [k, 0]),
  ) as EmotionScores;

  const zeroTonalities = Object.fromEntries(
    TONALITY_SCORE_FIELDS.map((k) => [k, 0]),
  ) as TonalityScores;

  let weightSum = 0;
  const emotionTotals: EmotionScores = { ...zeroEmotions };
  const tonalityTotals: TonalityScores = { ...zeroTonalities };

  for (const p of profiles) {
    const w = p.weight;
    weightSum += w;
    for (const k of EMOTION_SCORE_FIELDS) emotionTotals[k] += p.emotions[k] * w;
    for (const k of TONALITY_SCORE_FIELDS)
      tonalityTotals[k] += p.tonalities[k] * w;
  }

  const averagedEmotions: EmotionScores = { ...zeroEmotions };
  for (const k of EMOTION_SCORE_FIELDS) {
    averagedEmotions[k] = weightSum > 0 ? emotionTotals[k] / weightSum : 0;
  }

  const averagedTonalities: TonalityScores = { ...zeroTonalities };
  for (const k of TONALITY_SCORE_FIELDS) {
    averagedTonalities[k] = weightSum > 0 ? tonalityTotals[k] / weightSum : 0;
  }

  return {
    count: profiles.length,
    emotions: averagedEmotions,
    tonalities: averagedTonalities,
    confidenceMass: weightSum,
  };
}
