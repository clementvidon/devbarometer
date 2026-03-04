import { describe, expect, test } from 'vitest';
import { getStrengthLabel, type Tone } from './summarizeProfile';

describe(getStrengthLabel.name, () => {
  const justBelow = (t: number) =>
    t - 10 * Number.EPSILON * Math.max(1, Math.abs(t));

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

// function makeEmotionScores(
//   overrides: Partial<EmotionScores> = {},
// ): EmotionScores {
//   return {
//     joy: 0,
//     trust: 0,
//     anger: 0,
//     fear: 0,
//     sadness: 0,
//     disgust: 0,
//     ...overrides,
//   };
// }

// describe(pickStandoutsByScore.name, () => {
//   const cases = [
//     {
//       name: 'first standout',
//       emotions: makeEmotionScores({ joy: 0.5 }),
//       expected: { name: 'joy', score: 0.5 },
//     },
//     // {
//     //   emotions: makeEmotionScores({ joy: 0.5, trust: 0.5 }),
//     //   expected: { name: '', score: 0 },
//     // },
//     // {
//     //   emotions: makeEmotionScores({ joy: 0.5, trust: 0.5, fear: 0.5 }),
//     //   expected: { name: '', score: 0 },
//     // },
//     // {
//     //   emotions: makeEmotionScores({ joy: 0.5, trust: 0.75, fear: 0.5 }),
//     //   expected: { name: '', score: 0 },
//     // },
//   ];

//   test.each(cases)('gives $emotions, wants $expected', (c) => {
//     expect(pickStandoutsByScore(c.emotions)[0]).toStrictEqual(c.expected);
//   });
// });
