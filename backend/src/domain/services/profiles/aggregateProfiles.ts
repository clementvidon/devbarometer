import type {
  AggregatedEmotionProfile,
  EmotionProfile,
  EmotionScores,
  TonalityScores,
} from '../../entities';

const EMOTION_KEYS = [
  'anger',
  'fear',
  'trust',
  'sadness',
  'joy',
  'disgust',
] as const;

const TONALITY_KEYS = [
  'positive',
  'negative',
  'optimistic_anticipation',
  'pessimistic_anticipation',
  'positive_surprise',
  'negative_surprise',
] as const;

export function aggregateProfiles(
  profiles: EmotionProfile[],
): AggregatedEmotionProfile {
  if (profiles.length === 0) {
    throw new Error('[aggregateProfiles] No profiles provided.');
  }

  const zeroEmotions = Object.fromEntries(
    EMOTION_KEYS.map((k) => [k, 0]),
  ) as EmotionScores;

  const zeroTonalities = Object.fromEntries(
    TONALITY_KEYS.map((k) => [k, 0]),
  ) as TonalityScores;

  let weightSum = 0;
  const emotionTotals: EmotionScores = { ...zeroEmotions };
  const tonalityTotals: TonalityScores = { ...zeroTonalities };

  for (const p of profiles) {
    const w = p.weight;
    weightSum += w;
    for (const k of EMOTION_KEYS) emotionTotals[k] += p.emotions[k] * w;
    for (const k of TONALITY_KEYS) tonalityTotals[k] += p.tonalities[k] * w;
  }

  const averagedEmotions: EmotionScores = { ...zeroEmotions };
  for (const k of EMOTION_KEYS) {
    averagedEmotions[k] = weightSum > 0 ? emotionTotals[k] / weightSum : 0;
  }

  const averagedTonalities: TonalityScores = { ...zeroTonalities };
  for (const k of TONALITY_KEYS) {
    averagedTonalities[k] = weightSum > 0 ? tonalityTotals[k] / weightSum : 0;
  }

  return {
    count: profiles.length,
    emotions: averagedEmotions,
    tonalities: averagedTonalities,
    totalWeight: weightSum,
  };
}
