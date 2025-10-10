import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SnapshotData } from '../../domain/value-objects/PipelineSnapshot';

type DrizzleSpies = {
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
};

type GlobalWithSpies = typeof globalThis & {
  __drizzleSpies: DrizzleSpies;
};

declare global {
  var __drizzleSpies: DrizzleSpies;
}

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

  (globalThis as GlobalWithSpies).__drizzleSpies = {
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

import { PostgresAdapter } from './PostgresAdapter';

const getSpies = (): DrizzleSpies =>
  (globalThis as GlobalWithSpies).__drizzleSpies;

const FAKE_DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

describe('PostgresAdapter', () => {
  let adapter: PostgresAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PostgresAdapter(FAKE_DATABASE_URL);
  });

  it('storeSnapshotAt() insert a snapshot with id and date', async () => {
    const dummy = { foo: 'bar' } as unknown as SnapshotData;
    const createdAtISO = '2025-02-02T12:34:56.000Z';

    await adapter.storeSnapshotAt(createdAtISO, dummy);

    const { insert, values } = getSpies();
    expect(insert).toHaveBeenCalled();

    expect(values).toHaveBeenCalledWith({
      id: 'generated-id',
      data: dummy,
      date_created: new Date(createdAtISO),
    });
  });

  it('getSnapshots() returns snapshots newest-first', async () => {
    const snapshots = await adapter.getSnapshots();

    const { orderBy } = getSpies();
    expect(orderBy).toHaveBeenCalled();

    expect(snapshots).toEqual([
      { foo: 'bar', id: 'generated-id', createdAt: '2025-01-01T00:00:00.000Z' },
    ]);
  });
});
