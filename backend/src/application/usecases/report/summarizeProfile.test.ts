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

  test.each(cases)('gives $score wants $expected', (c) => {
    expect(getStrengthLabel(c.score)).toBe(c.expected);
  });
});
