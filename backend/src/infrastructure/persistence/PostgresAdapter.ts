import { desc } from 'drizzle-orm';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Sql } from 'postgres';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import type { PersistencePort } from '../../application/ports/output/PersistencePort';
import {
  PipelineSnapshotSchema,
  SnapshotDataSchema,
  type PipelineSnapshot,
  type SnapshotData,
} from '../../domain/value-objects/PipelineSnapshot';
import { snapshotsTable } from './schema';

const pg = postgres as unknown as (...args: Parameters<typeof postgres>) => Sql;

export class PostgresAdapter implements PersistencePort {
  private readonly db: PostgresJsDatabase;

  constructor(databaseUrl: string) {
    const client = pg(databaseUrl, { ssl: 'require' });
    this.db = drizzle(client);
  }

  async storeSnapshotAt(
    createdAtISO: string,
    snapshot: SnapshotData,
  ): Promise<void> {
    const parsedSnapshot = SnapshotDataSchema.parse(snapshot);
    await this.db.insert(snapshotsTable).values({
      id: uuidv4(),
      data: parsedSnapshot,
      date_created: new Date(createdAtISO),
    });
  }

  async getSnapshots(): Promise<PipelineSnapshot[]> {
    const rows = await this.db
      .select({
        id: snapshotsTable.id,
        data: snapshotsTable.data,
        createdAt: snapshotsTable.date_created,
      })
      .from(snapshotsTable)
      .orderBy(desc(snapshotsTable.date_created));

    return rows.map((row) => {
      if (!row.createdAt) {
        throw new Error('[PostgresAdapter.getSnapshots] Missing date_created.');
      }

      return PipelineSnapshotSchema.parse({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        ...SnapshotDataSchema.parse(row.data),
      });
    });
  }
}
