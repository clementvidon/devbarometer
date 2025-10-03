import { desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { Sql } from 'postgres';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import type { PersistencePort } from '../../../core/port/PersistencePort';
import type {
  PipelineSnapshot,
  SnapshotData,
} from '../../../core/types/PipelineSnapshot';
import { snapshotsTable } from './schema';

const pg = postgres as unknown as (...args: Parameters<typeof postgres>) => Sql;
const client: Sql = pg(process.env.DATABASE_URL!, { ssl: 'require' });
const db = drizzle(client);

export class PostgresAdapter implements PersistencePort {
  async storeSnapshotAt(
    createdAtISO: string,
    snapshot: SnapshotData,
  ): Promise<void> {
    await db.insert(snapshotsTable).values({
      id: uuidv4(),
      data: snapshot,
      date_created: new Date(createdAtISO),
    });
  }

  async getSnapshots(): Promise<PipelineSnapshot[]> {
    const rows = await db
      .select({
        id: snapshotsTable.id,
        data: snapshotsTable.data,
        createdAt: snapshotsTable.date_created,
      })
      .from(snapshotsTable)
      .orderBy(desc(snapshotsTable.date_created));

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt
        ? row.createdAt.toISOString()
        : new Date().toISOString(),
      ...(row.data as SnapshotData),
    }));
  }
}
