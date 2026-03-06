import type { EmotionScores, TonalityScores } from '@devbarometer/shared';
import type { AggregatedEmotionProfile } from '../../../domain/entities';

export type StrengthLabel =
  | 'very weak'
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'very strong';

export type EmotionKey = keyof EmotionScores;
export type EmotionLabels = { name: EmotionKey; strength: StrengthLabel };

export const TONALITY_KEYS = ['polarity', 'anticipation', 'surprise'] as const;
export type TonalityKey = (typeof TONALITY_KEYS)[number];

export type TonalityValue = 'neutral' | 'positive' | 'negative' | 'polarized';
export type TonalityLabels = {
  name: TonalityKey;
  value: TonalityValue;
  strength?: StrengthLabel;
};

export type EmotionProfileSummary = {
  emotionsStrength: EmotionLabels[];
  tonalitiesStrength: TonalityLabels[];
  standoutEmotions: EmotionLabels[];
};

export const MIN_STANDOUT_SCORE = 0.35;
export const MAX_STANDOUT_COUNT = 2;
export const RELATIVE_GAP = 0.06;

export const MIN_SCORE_FOR_POLARIZED = 0.3;
export const MAX_DISTANCE_FOR_POLARIZED = 0.06;
export const MAX_DISTANCE_FOR_NEUTRAL = MAX_DISTANCE_FOR_POLARIZED;

export function getStrengthLabel(score: number): StrengthLabel {
  return score < 0.2
    ? 'very weak'
    : score < 0.4
      ? 'weak'
      : score < 0.6
        ? 'moderate'
        : score < 0.8
          ? 'strong'
          : 'very strong';
}

type StandoutByScore = { name: EmotionKey; score: number };

export function pickStandoutsByScore(
  emotions: EmotionScores,
): StandoutByScore[] {
  const sorted = (Object.entries(emotions) as [EmotionKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([name, score]) => ({ name, score }));

  const [first, second] = sorted;

  const res: StandoutByScore[] = [];
  if (first.score < MIN_STANDOUT_SCORE) {
    return [];
  }
  res.push(first);

  if (
    second.score >= MIN_STANDOUT_SCORE ||
    first.score - second.score <= RELATIVE_GAP
  ) {
    res.push(second);
  }

  return res.slice(0, MAX_STANDOUT_COUNT);
}

// Scores are independent intensities (not probabilities; they don't sum to 1).
// "polarized" = both sides high and close to each other.

export function evaluateTone(
  posScore: number,
  negScore: number,
): { value: TonalityValue; strength?: StrengthLabel } {
  const delta = posScore - negScore;
  const distance = Math.abs(delta);
  const hi = Math.max(posScore, negScore);
  const lo = Math.min(posScore, negScore);

  if (
    hi >= MIN_SCORE_FOR_POLARIZED &&
    lo >= MIN_SCORE_FOR_POLARIZED &&
    distance <= MAX_DISTANCE_FOR_POLARIZED
  ) {
    return { value: 'polarized', strength: getStrengthLabel(hi) };
  }

  if (distance <= MAX_DISTANCE_FOR_NEUTRAL) {
    return { value: 'neutral' };
  }

  return {
    value: delta > 0 ? 'positive' : 'negative',
    strength: getStrengthLabel(distance),
  };
}

type TonalityScoreKey = keyof TonalityScores;
type TonalityAxisFields = { pos: TonalityScoreKey; neg: TonalityScoreKey };

export const TONALITY_AXES = {
  polarity: { pos: 'positive', neg: 'negative' },
  anticipation: {
    pos: 'optimistic_anticipation',
    neg: 'pessimistic_anticipation',
  },
  surprise: { pos: 'positive_surprise', neg: 'negative_surprise' },
} as const satisfies Record<TonalityKey, TonalityAxisFields>;

export function summarizeProfile(
  profile: AggregatedEmotionProfile,
): EmotionProfileSummary {
  const { emotions, tonalities } = profile;

  const emotionsStrength = (
    Object.entries(emotions) as [EmotionKey, number][]
  ).map(([name, score]) => ({ name, strength: getStrengthLabel(score) }));

  const tonalitiesStrength = TONALITY_KEYS.map((name) => {
    const { pos, neg } = TONALITY_AXES[name];
    const tone = evaluateTone(tonalities[pos], tonalities[neg]);
    return { name, value: tone.value, strength: tone.strength };
  });

  const standoutEmotions = pickStandoutsByScore(emotions).map((v) => ({
    name: v.name,
    strength: getStrengthLabel(v.score),
  }));

  return { emotionsStrength, tonalitiesStrength, standoutEmotions };
}
