export type SmoothLevel = 'detail' | 'custom' | 'clean' | 'narrative';

type Preset = { K: number; passes: number; anchors: number };
const PRESETS: Record<SmoothLevel, Preset> = {
  detail: { K: 8, passes: 1, anchors: 8 },
  custom: { K: 8, passes: 2, anchors: 10 },
  clean: { K: 5, passes: 2, anchors: 7 },
  narrative: { K: 3, passes: 2, anchors: 6 },
};

type NumericKey<T> = {
  [K in keyof T]-?: T[K] extends number ? K : never;
}[keyof T];

type Writeable<T> = { -readonly [K in keyof T]: T[K] };

function alphaFromHalfLife(h: number): number {
  const a = 1 - Math.pow(2, -1 / Math.max(h, 1e-6));
  return Math.min(0.95, Math.max(0.02, a));
}

function emaPass<T extends Record<string, unknown>>(
  data: readonly T[],
  keys: readonly NumericKey<T>[],
  alpha: number,
): T[] {
  const acc = {} as Partial<Record<NumericKey<T>, number>>;
  return data.map((p, i) => {
    const out: Writeable<T> = { ...p };
    for (const k of keys) {
      const v = p[k];
      if (typeof v !== 'number') continue;
      const prev = i === 0 ? v : alpha * v + (1 - alpha) * (acc[k] ?? v);
      (out as unknown as Record<NumericKey<T>, number>)[k] = prev;
      acc[k] = prev;
    }
    return out;
  });
}

function makePchip(xs: number[], ys: number[]) {
  const n = xs.length;
  const h = Array.from({ length: n - 1 }, (_, i) => xs[i + 1] - xs[i]);
  const slope = Array.from(
    { length: n - 1 },
    (_, i) => (ys[i + 1] - ys[i]) / h[i],
  );
  const m = new Array<number>(n);

  m[0] = slope[0];
  m[n - 1] = slope[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }

  return (x: number): number => {
    let i = xs.findIndex((xx, j) => x >= xx && x <= xs[j + 1]);
    if (i < 0) i = n - 2;
    const t = (x - xs[i]) / h[i];
    const y0 = ys[i],
      y1 = ys[i + 1];
    const m0 = m[i],
      m1 = m[i + 1];
    const t2 = t * t,
      t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    return h00 * y0 + h10 * h[i] * m0 + h01 * y1 + h11 * h[i] * m1;
  };
}

function reconstructWithAnchors<T extends Record<string, unknown>>(
  data: readonly T[],
  keys: readonly NumericKey<T>[],
  anchors: number,
): T[] {
  const N = data.length;
  if (N <= anchors) return [...data];

  const xs = data.map((_, i) => i);
  const idx = Array.from({ length: anchors }, (_, i) =>
    Math.round((i * (N - 1)) / (anchors - 1)),
  );

  const out = data.map((p) => ({ ...p })) as Writeable<T>[];
  for (const k of keys) {
    const vals: number[] = data.map((d) =>
      typeof d[k] === 'number' ? d[k] : 0,
    );
    const f = makePchip(
      idx,
      idx.map((i) => vals[i]),
    );
    for (let i = 0; i < N; i++) {
      (out[i] as unknown as Record<NumericKey<T>, number>)[k] = f(xs[i]);
    }
  }
  return out;
}

export function smoothUX<T extends Record<string, unknown>>(
  data: readonly T[],
  numericKeys: readonly NumericKey<T>[],
  level: SmoothLevel = 'clean',
): T[] {
  const N = data.length;
  if (N <= 2) return [...data];
  const { K: kPreset, passes, anchors } = PRESETS[level];

  const alpha = alphaFromHalfLife(Math.max(2, N / kPreset));
  let tmp: T[] = [...data];
  for (let i = 0; i < passes; i++) {
    tmp = emaPass(tmp, numericKeys, alpha);
  }

  const safeAnchors = Math.min(Math.max(3, anchors), N);
  return safeAnchors < N
    ? reconstructWithAnchors(tmp, numericKeys, safeAnchors)
    : tmp;
}
