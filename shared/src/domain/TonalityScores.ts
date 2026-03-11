import { z } from 'zod';

export const TonalityScoresSchema = z.object({
  positive: z.number().min(0).max(1),
  negative: z.number().min(0).max(1),
  positive_surprise: z.number().min(0).max(1),
  negative_surprise: z.number().min(0).max(1),
  optimistic_anticipation: z.number().min(0).max(1),
  pessimistic_anticipation: z.number().min(0).max(1),
});
export type TonalityScores = z.infer<typeof TonalityScoresSchema>;

export const TONALITY_SCORE_FIELDS = [
  'positive',
  'negative',
  'positive_surprise',
  'negative_surprise',
  'optimistic_anticipation',
  'pessimistic_anticipation',
] as const;
export type TonalityScoreField = (typeof TONALITY_SCORE_FIELDS)[number];

export const TONALITY_AXIS_KEYS = [
  'polarity',
  'anticipation',
  'surprise',
] as const;
export type TonalityAxisKey = (typeof TONALITY_AXIS_KEYS)[number];

export type TonalityAxisFields = {
  pos: TonalityScoreField;
  neg: TonalityScoreField;
};

export const TONALITY_AXIS_FIELDS = {
  polarity: { pos: 'positive', neg: 'negative' },
  anticipation: {
    pos: 'optimistic_anticipation',
    neg: 'pessimistic_anticipation',
  },
  surprise: { pos: 'positive_surprise', neg: 'negative_surprise' },
} as const satisfies Record<TonalityAxisKey, TonalityAxisFields>;
