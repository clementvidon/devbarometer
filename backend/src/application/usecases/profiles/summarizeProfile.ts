import type { EmotionScores } from '@devbarometer/shared';
import type { AggregatedEmotionProfile } from '../../../domain/entities';

/* pickStandoutsByScore */

type Standout = { name: keyof EmotionScores; score: number };

export const MIN_STANDOUT = 0.35;
const MAX_STANDOUTS = 2;
const REL_GAP = 0.06;
const EPS = 1e-6;

function pickStandoutsByScore(emotions: EmotionScores): Standout[] {
  const sorted = (Object.entries(emotions) as [keyof EmotionScores, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([name, score]) => ({ name, score }));

  const first = sorted[0];
  const second = sorted[1];

  const res: Standout[] = [];
  if (first.score + EPS >= MIN_STANDOUT) res.push(first);

  if (
    second.score + EPS >= MIN_STANDOUT ||
    first.score - second.score <= REL_GAP
  ) {
    res.push(second);
  }

  return res.slice(0, MAX_STANDOUTS);
}

/* evaluateTone */

type Tone = {
  value: 'neutral' | 'positive' | 'negative' | 'polarized';
  strength?: 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong';
};

function getStrengthLabel(score: number): Tone['strength'] {
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

const POLARITY_MIN = 0.3;
const POLARITY_DELTA = 0.06;
const NEUTRAL_DELTA = 0.06;

function evaluateTone(positive: number, negative: number): Tone {
  const delta = positive - negative;
  const absDelta = Math.abs(delta);
  const max = Math.max(positive, negative);
  const min = Math.min(positive, negative);

  if (max > POLARITY_MIN && min > POLARITY_MIN && absDelta < POLARITY_DELTA) {
    return {
      value: 'polarized',
      strength: getStrengthLabel(max),
    };
  }

  if (absDelta < NEUTRAL_DELTA) {
    return { value: 'neutral' };
  }

  return {
    value: delta > 0 ? 'positive' : 'negative',
    strength: getStrengthLabel(absDelta),
  };
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
