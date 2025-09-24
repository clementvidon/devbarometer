export type RawEntry = {
  createdAt: string;
  emotions: Record<string, number>;
};

export function isRawEntry(x: unknown): x is RawEntry {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.createdAt === 'string' &&
    typeof o.emotions === 'object' &&
    o.emotions !== null
  );
}

export function assertRawEntries(x: unknown): asserts x is RawEntry[] {
  if (!Array.isArray(x) || !x.every(isRawEntry)) {
    throw new Error('Invalid chart.json shape');
  }
}

export interface EmotionScores {
  anger: number;
  fear: number;
  trust: number;
  sadness: number;
  joy: number;
  disgust: number;
}

export interface TonalityScores {
  positive: number;
  negative: number;
  optimistic_anticipation: number;
  pessimistic_anticipation: number;
  positive_surprise: number;
  negative_surprise: number;
}

export interface AggregatedEmotionProfile {
  date: string;
  count: number;
  totalWeight: number;
  emotions: EmotionScores;
  tonalities: TonalityScores;
}
