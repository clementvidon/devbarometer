import type { EmotionScores } from '@devbarometer/shared';
import { describe, expect, test } from 'vitest';
import type {
  AggregatedEmotionProfile,
  TonalityScores,
} from '../../../domain/entities';
import {
  evaluateTone,
  getStrengthLabel,
  MAX_DISTANCE_FOR_POLARIZED,
  MIN_SCORE_FOR_POLARIZED,
  MIN_STANDOUT_SCORE,
  pickStandoutsByScore,
  RELATIVE_GAP,
  summarizeProfile,
  type StrengthLabel,
} from './summarizeProfile';

/**
 * Spec: Summarize the given aggregated emotion profile
 *
 * Inputs:
 * - an aggregated emotion profile (emotions + tonalities scores)
 *
 * Output:
 * - an EmotionProfileSummary where:
 *  - emotionsStrength: each emotion score mapped to a StrengthLabel
 *  - standoutEmotions: selected standouts mapped to StrengthLabel (order preserved)
 *  - tonalitiesStrength: polarity/anticipation/surprise mapped to { value, strength? }
 *
 * Behavior:
 * - turns each emotion score into a StrengthLabel
 * - evaluates the 3 tonalities (polarity, anticipation, surprise) into labeled tonalities
 * - picks standout emotions by score and turns their scores into StrengthLabels
 */

const justBelow = (t: number) =>
  t - 10 * Number.EPSILON * Math.max(1, Math.abs(t));
const justAbove = (t: number) =>
  t + 10 * Number.EPSILON * Math.max(1, Math.abs(t));

const MAX_SCORE = 1;

describe(summarizeProfile.name, () => {
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
  function makeTonalityScores(
    overrides: Partial<TonalityScores> = {},
  ): TonalityScores {
    return {
      positive: 1,
      negative: 1,
      positive_surprise: 1,
      negative_surprise: 1,
      optimistic_anticipation: 1,
      pessimistic_anticipation: 1,
      ...overrides,
    };
  }
  function makeAggregatedEmotionProfile(
    overrides: Partial<AggregatedEmotionProfile> = {},
  ): AggregatedEmotionProfile {
    return {
      count: 0,
      totalWeight: 0,
      emotions: makeEmotionScores(),
      tonalities: makeTonalityScores(),
      ...overrides,
    };
  }
  test('wires emotions + tonalities + standouts', () => {
    const overrides = {
      joy: MIN_STANDOUT_SCORE,
      fear: MAX_SCORE,
    };
    const profile = makeAggregatedEmotionProfile({
      emotions: makeEmotionScores(overrides),
      tonalities: makeTonalityScores(),
    });

    const result = summarizeProfile(profile);

    expect(result.emotionsStrength).toHaveLength(
      Object.keys(profile.emotions).length,
    );
    result.emotionsStrength.forEach(({ strength, name }) => {
      expect(strength).toEqual(getStrengthLabel(profile.emotions[name]));
    });

    const expectedAxes = {
      polarity: { pos: 'positive', neg: 'negative' },
      anticipation: {
        pos: 'optimistic_anticipation',
        neg: 'pessimistic_anticipation',
      },
      surprise: { pos: 'positive_surprise', neg: 'negative_surprise' },
    } as const;

    const tonalityKeys = ['polarity', 'anticipation', 'surprise'] as const;

    expect(result.tonalitiesStrength).toHaveLength(tonalityKeys.length);
    expect(result.tonalitiesStrength.map((t) => t.name)).toStrictEqual([
      ...tonalityKeys,
    ]);

    result.tonalitiesStrength.forEach((t) => {
      const { pos, neg } = expectedAxes[t.name];
      const expected = evaluateTone(
        profile.tonalities[pos],
        profile.tonalities[neg],
      );

      expect(t.value).toEqual(expected.value);
      expect(t.strength).toEqual(expected.strength);
    });

    const sortedOverrides = Object.entries(overrides).sort(
      (a, b) => b[1] - a[1],
    );

    const standoutEmotions = sortedOverrides.map(([name, score]) => ({
      name,
      strength: getStrengthLabel(score),
    }));

    expect(result.standoutEmotions).toStrictEqual(standoutEmotions);
  });
  test('no standout emotions', () => {
    const profile = makeAggregatedEmotionProfile();

    const result = summarizeProfile(profile);

    expect(result.standoutEmotions).toHaveLength(0);
  });
});

describe(pickStandoutsByScore.name, () => {
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
  const cases = [
    {
      testName: 'no standouts',
      emotions: makeEmotionScores({ joy: justBelow(MIN_STANDOUT_SCORE) }),
      expected: [],
    },
    {
      testName: 'only first standout',
      emotions: makeEmotionScores({
        joy: MIN_STANDOUT_SCORE,
      }),
      expected: [{ name: 'joy', score: MIN_STANDOUT_SCORE }],
    },
    {
      testName: 'both standouts (second by score)',
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
      testName: 'second excluded (gap too large)',
      emotions: makeEmotionScores({
        joy: MIN_STANDOUT_SCORE,
        trust: MIN_STANDOUT_SCORE - justAbove(RELATIVE_GAP),
      }),
      expected: [{ name: 'joy', score: MIN_STANDOUT_SCORE }],
    },
    {
      testName: 'second included (by gap)',
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
      testName: 'sorts by score descending',
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
      testName: 'ties resolved by object key order',
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

  test.each(cases)('$testName', (c) => {
    const standout = pickStandoutsByScore(c.emotions);
    expect(standout).toStrictEqual(c.expected);
  });
});

describe(evaluateTone.name, () => {
  const cases = [
    {
      name: 'neutral: close but low',
      posScore: justBelow(MIN_SCORE_FOR_POLARIZED),
      negScore: justBelow(MIN_SCORE_FOR_POLARIZED),
      expected: { value: 'neutral' },
    },
    {
      name: 'polarized: close and too high for neutral (weak)',
      posScore: MIN_SCORE_FOR_POLARIZED,
      negScore: MIN_SCORE_FOR_POLARIZED,
      expected: { value: 'polarized', strength: 'weak' },
    },
    {
      name: 'polarized: close and very high',
      posScore: MAX_SCORE,
      negScore: MAX_SCORE,
      expected: { value: 'polarized', strength: 'very strong' },
    },
    {
      name: 'polarized: distance is just below max',
      posScore: MAX_SCORE,
      negScore: MAX_SCORE - justBelow(MAX_DISTANCE_FOR_POLARIZED),
      expected: { value: 'polarized', strength: 'very strong' },
    },
    {
      name: 'not polarized: distance is just above max',
      posScore: MAX_SCORE,
      negScore: MAX_SCORE - justAbove(MAX_DISTANCE_FOR_POLARIZED),
      expected: { value: 'positive', strength: 'very weak' },
    },
    {
      name: 'negative: distance just above max',
      posScore: MAX_SCORE,
      negScore: MAX_SCORE + justAbove(MAX_DISTANCE_FOR_POLARIZED),
      expected: { value: 'negative', strength: 'very weak' },
    },
    {
      name: 'positive: strength uses distance',
      posScore: MIN_SCORE_FOR_POLARIZED,
      negScore: -MAX_SCORE,
      expected: { value: 'positive', strength: 'very strong' },
    },
    {
      name: 'negative: large distance',
      posScore: MIN_SCORE_FOR_POLARIZED,
      negScore: MAX_SCORE,
      expected: { value: 'negative', strength: 'strong' },
    },
  ];

  test.each(cases)('$name', (c) => {
    expect(evaluateTone(c.posScore, c.negScore)).toStrictEqual(c.expected);
  });
});

describe(getStrengthLabel.name, () => {
  const MIN_SCORE = 0;
  const cases = [
    { score: MIN_SCORE, expected: 'very weak' },
    { score: MAX_SCORE, expected: 'very strong' },
    { score: justBelow(0.2), expected: 'very weak' },
    { score: justBelow(0.4), expected: 'weak' },
    { score: justBelow(0.6), expected: 'moderate' },
    { score: justBelow(0.8), expected: 'strong' },
    { score: 0.2, expected: 'weak' },
    { score: 0.4, expected: 'moderate' },
    { score: 0.6, expected: 'strong' },
    { score: 0.8, expected: 'very strong' },
  ] satisfies Array<{ score: number; expected: StrengthLabel }>;

  test.each(cases)('gives $score, wants $expected', (c) => {
    expect(getStrengthLabel(c.score)).toBe(c.expected);
  });
});
