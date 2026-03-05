import type { EmotionScores } from '@devbarometer/shared';
import type { AggregatedEmotionProfile } from '../../../domain/entities';

/* pickStandoutsByScore */

type Standout = { name: keyof EmotionScores; score: number };

export const MIN_STANDOUT_SCORE = 0.35;
export const MAX_STANDOUT_COUNT = 2;
export const RELATIVE_GAP = 0.06;

export function pickStandoutsByScore(emotions: EmotionScores): Standout[] {
  const sorted = (Object.entries(emotions) as [keyof EmotionScores, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([name, score]) => ({ name, score }));

  const [first, second] = sorted;

  const res: Standout[] = [];
  if (first.score < MIN_STANDOUT_SCORE) return [];
  else res.push(first);

  if (
    second.score >= MIN_STANDOUT_SCORE ||
    first.score - second.score <= RELATIVE_GAP
  ) {
    res.push(second);
  }

  return res.slice(0, MAX_STANDOUT_COUNT);
}

/* evaluateTone */

export type Tone = {
  value: 'neutral' | 'positive' | 'negative' | 'polarized';
  strength?: 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong';
};

export function getStrengthLabel(score: number): Tone['strength'] {
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

export const MIN_SCORE_FOR_POLARIZED = 0.3;
export const MAX_DISTANCE_FOR_POLARIZED = 0.06;
export const MAX_DISTANCE_FOR_NEUTRAL = MAX_DISTANCE_FOR_POLARIZED;

// Scores are independent intensities (not probabilities; they don't sum to 1).
// "polarized" = both sides high and close to each other.

export function evaluateTone(posScore: number, negScore: number): Tone {
  const delta = posScore - negScore;
  const distance = Math.abs(delta);
  const hi = Math.max(posScore, negScore);
  const lo = Math.min(posScore, negScore);

  if (
    hi > MIN_SCORE_FOR_POLARIZED &&
    lo > MIN_SCORE_FOR_POLARIZED &&
    distance < MAX_DISTANCE_FOR_POLARIZED
  ) {
    return {
      value: 'polarized',
      strength: getStrengthLabel(hi),
    };
  } else if (distance < MAX_DISTANCE_FOR_NEUTRAL) {
    return { value: 'neutral' };
  } else {
    return {
      value: delta > 0 ? 'positive' : 'negative',
      strength: getStrengthLabel(distance),
    };
  }
}

export type EmotionProfileSummary = {
  emotions: { name: keyof EmotionScores; strength: Tone['strength'] }[];
  standoutEmotions: Standout[];
  polarity: Tone;
  anticipation: Tone;
  surprise: Tone;
};

export function summarizeProfile(
  profile: AggregatedEmotionProfile,
): EmotionProfileSummary {
  const { emotions, tonalities } = profile;

  const summary = (
    Object.entries(emotions) as [keyof EmotionScores, number][]
  ).map(([name, score]) => ({
    name,
    strength: getStrengthLabel(score),
  }));

  return {
    emotions: summary,
    standoutEmotions: pickStandoutsByScore(profile.emotions),
    polarity: evaluateTone(tonalities.positive, tonalities.negative),
    anticipation: evaluateTone(
      tonalities.optimistic_anticipation,
      tonalities.pessimistic_anticipation,
    ),
    surprise: evaluateTone(
      tonalities.positive_surprise,
      tonalities.negative_surprise,
    ),
  };
}
