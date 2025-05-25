import { desc } from 'drizzle-orm';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Sql } from 'postgres';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import type { PersistencePort } from '../../../core/port/PersistencePort.ts';
import type { PipelineSnapshot } from '../../../core/types/PipelineSnapshot.ts';
import { snapshotsTable } from './schema.ts';

const pg = postgres as unknown as (...args: Parameters<typeof postgres>) => Sql;
const client: Sql = pg(process.env.DATABASE_URL!, { ssl: 'require' });
const db: PostgresJsDatabase = drizzle(client);

type PersistedSnapshot = PipelineSnapshot & {
  id: string;
  createdAt: string;
};

export class PostgresAdapter implements PersistencePort {
  async storeSnapshot(
    snapshot: Omit<PipelineSnapshot, 'id' | 'createdAt'>,
  ): Promise<void> {
    await db.insert(snapshotsTable).values({
      id: uuidv4(),
      data: snapshot,
    });
  }

  async getSnapshots(): Promise<PersistedSnapshot[]> {
    const rows = await db
      .select({
        id: snapshotsTable.id,
        data: snapshotsTable.data,
        createdAt: snapshotsTable.date_created,
      })
      .from(snapshotsTable)
      .orderBy(desc(snapshotsTable.date_created));

    return rows.map((row) => ({
      ...(row.data as PipelineSnapshot),
      id: row.id,
      createdAt: row.createdAt
        ? row.createdAt.toISOString()
        : new Date().toISOString(),
    }));
  }
}
