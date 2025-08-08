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
