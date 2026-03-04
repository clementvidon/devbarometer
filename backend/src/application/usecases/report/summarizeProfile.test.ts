import type { EmotionScores } from '@devbarometer/shared';
import { describe, expect, test } from 'vitest';
import {
  getStrengthLabel,
  MIN_STANDOUT_SCORE,
  pickStandoutsByScore,
  RELATIVE_GAP,
  type Tone,
} from './summarizeProfile';

const justBelow = (t: number) =>
  t - 10 * Number.EPSILON * Math.max(1, Math.abs(t));
const justAbove = (t: number) =>
  t + 10 * Number.EPSILON * Math.max(1, Math.abs(t));

describe(getStrengthLabel.name, () => {
  const cases = [
    { score: -10, expected: 'very weak' },
    { score: 10, expected: 'very strong' },
    { score: justBelow(0.2), expected: 'very weak' },
    { score: justBelow(0.4), expected: 'weak' },
    { score: justBelow(0.6), expected: 'moderate' },
    { score: justBelow(0.8), expected: 'strong' },
    { score: 0.2, expected: 'weak' },
    { score: 0.4, expected: 'moderate' },
    { score: 0.6, expected: 'strong' },
    { score: 0.8, expected: 'very strong' },
  ] satisfies Array<{ score: number; expected: Tone['strength'] }>;

  test.each(cases)('gives $score, wants $expected', (c) => {
    expect(getStrengthLabel(c.score)).toBe(c.expected);
  });
});

function makeEmotionScores(
  overrides: Partial<EmotionScores> = {},
): EmotionScores {
  return {
    joy: 0,
    trust: 0,
    anger: 0,
    fear: 0,
    sadness: 0,
    disgust: 0,
    ...overrides,
  };
}

describe(pickStandoutsByScore.name, () => {
  const cases = [
    {
      name: 'no standouts',
      emotions: makeEmotionScores({ joy: justBelow(MIN_STANDOUT_SCORE) }),
      expected: [],
    },
    {
      name: 'only first standout',
      emotions: makeEmotionScores({
        joy: MIN_STANDOUT_SCORE,
      }),
      expected: [{ name: 'joy', score: MIN_STANDOUT_SCORE }],
    },
    {
      name: 'both standouts (second by score)',
      emotions: makeEmotionScores({
        joy: justAbove(MIN_STANDOUT_SCORE),
        trust: MIN_STANDOUT_SCORE,
      }),
      expected: [
        { name: 'joy', score: justAbove(MIN_STANDOUT_SCORE) },
        {
          name: 'trust',
          score: MIN_STANDOUT_SCORE,
        },
      ],
    },
    {
      name: 'second excluded (gap too large)',
      emotions: makeEmotionScores({
        joy: MIN_STANDOUT_SCORE,
        trust: MIN_STANDOUT_SCORE - justAbove(RELATIVE_GAP),
      }),
      expected: [{ name: 'joy', score: MIN_STANDOUT_SCORE }],
    },
    {
      name: 'second included (by gap)',
      emotions: makeEmotionScores({
        joy: MIN_STANDOUT_SCORE,
        trust: MIN_STANDOUT_SCORE - justBelow(RELATIVE_GAP),
      }),
      expected: [
        { name: 'joy', score: MIN_STANDOUT_SCORE },
        { name: 'trust', score: MIN_STANDOUT_SCORE - justBelow(RELATIVE_GAP) },
      ],
    },
    {
      name: 'sorts by score descending',
      emotions: makeEmotionScores({
        joy: MIN_STANDOUT_SCORE,
        trust: justAbove(MIN_STANDOUT_SCORE),
      }),
      expected: [
        {
          name: 'trust',
          score: justAbove(MIN_STANDOUT_SCORE),
        },
        { name: 'joy', score: MIN_STANDOUT_SCORE },
      ],
    },
    {
      name: 'ties resolved by object key order',
      emotions: makeEmotionScores({
        joy: MIN_STANDOUT_SCORE,
        trust: MIN_STANDOUT_SCORE,
        anger: MIN_STANDOUT_SCORE,
      }),
      expected: [
        { name: 'joy', score: MIN_STANDOUT_SCORE },
        { name: 'trust', score: MIN_STANDOUT_SCORE },
      ],
    },
  ];

  test.each(cases)('$name', (c) => {
    const standout = pickStandoutsByScore(c.emotions);
    expect(standout).toStrictEqual(c.expected);
  });
});
