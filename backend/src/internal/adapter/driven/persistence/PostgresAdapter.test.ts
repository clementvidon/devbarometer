// backend/src/internal/adapter/driven/persistence/PostgresAdapter.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PipelineSnapshot } from '../../../core/types/PipelineSnapshot';

/* ------------------------------------------------------------------ */
/* 1. Types & déclaration globale pour les spies                      */
/* ------------------------------------------------------------------ */
type DrizzleSpies = {
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
};

// On ajoute la propriété sur l’objet global pour que TS la connaisse
declare global {
  var __drizzleSpies: DrizzleSpies;
}

/* ------------------------------------------------------------------ */
/* 2. Mocks des dépendances                                           */
/* ------------------------------------------------------------------ */
vi.mock('postgres', () => ({ default: vi.fn(() => ({})) }));
vi.mock('drizzle-orm', () => ({
  desc: vi.fn((col: unknown): unknown => col),
}));
vi.mock('drizzle-orm/postgres-js', () => {
  const values = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn(() => ({ values }));

  const orderBy = vi.fn().mockResolvedValue([
    {
      id: 'generated-id',
      data: { foo: 'bar' },
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
  ]);
  const from = vi.fn(() => ({ orderBy }));
  const select = vi.fn(() => ({ from }));

  // ➜ publication des spies sans utiliser `any`
  (
    globalThis as typeof globalThis & { __drizzleSpies: DrizzleSpies }
  ).__drizzleSpies = {
    insert,
    values,
    orderBy,
  };

  return {
    drizzle: vi.fn(() => ({
      insert,
      select,
    })),
    desc: vi.fn(),
  };
});

vi.mock('uuid', () => ({ v4: () => 'generated-id' }));

/* ------------------------------------------------------------------ */
/* 3. Module à tester                                                 */
/* ------------------------------------------------------------------ */
import { PostgresAdapter } from './PostgresAdapter.ts';

/* ------------------------------------------------------------------ */
/* 4. Accès typé aux spies                                            */
/* ------------------------------------------------------------------ */
const getSpies = (): DrizzleSpies => globalThis.__drizzleSpies;

/* ------------------------------------------------------------------ */
/* 5. Tests                                                           */
/* ------------------------------------------------------------------ */
describe('PostgresAdapter', () => {
  let adapter: PostgresAdapter;

  beforeEach(() => {
    adapter = new PostgresAdapter();
    vi.clearAllMocks();
  });

  it('storeSnapshot() insère un snapshot avec un id généré', async () => {
    const dummy: Omit<PipelineSnapshot, 'id' | 'createdAt'> = {
      foo: 'bar',
    } as unknown as Omit<PipelineSnapshot, 'id' | 'createdAt'>;

    await adapter.storeSnapshot(dummy);

    const { insert, values } = getSpies();
    expect(insert).toHaveBeenCalled();
    expect(values).toHaveBeenCalledWith({
      id: 'generated-id',
      data: dummy,
    });
  });

  it('getSnapshots() renvoie les snapshots mappés', async () => {
    const snapshots = await adapter.getSnapshots();

    const { orderBy } = getSpies();
    expect(orderBy).toHaveBeenCalled();
    expect(snapshots).toEqual([
      { foo: 'bar', id: 'generated-id', createdAt: '2025-01-01T00:00:00.000Z' },
    ]);
  });
});
