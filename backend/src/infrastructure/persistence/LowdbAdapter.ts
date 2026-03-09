import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import type { PersistencePort } from '../../application/ports/output/PersistencePort';
import {
  PipelineSnapshotSchema,
  SnapshotDataSchema,
  type PipelineSnapshot,
  type SnapshotData,
} from '../../domain/value-objects/PipelineSnapshot';

type Data = {
  snapshots: PipelineSnapshot[];
};

type DbType = ReturnType<typeof JSONFilePreset<Data>>;

const DB_PATH = 'db.json';

const defaultData: Data = {
  snapshots: [],
} as const;

export class LowdbAdapter implements PersistencePort {
  private dbPromise: Promise<Awaited<DbType>>;

  constructor() {
    this.dbPromise = JSONFilePreset<Data>(DB_PATH, defaultData);
  }

  private async getDb(): Promise<Awaited<DbType>> {
    return this.dbPromise;
  }

  async storeSnapshotAt(
    createdAtISO: string,
    snapshot: SnapshotData,
  ): Promise<void> {
    const db = await this.getDb();
    db.data.snapshots.push(
      PipelineSnapshotSchema.parse({
        id: uuidv4(),
        createdAt: new Date(createdAtISO).toISOString(),
        ...SnapshotDataSchema.parse(snapshot),
      }),
    );
    await db.write();
  }

  async getSnapshots(): Promise<PipelineSnapshot[]> {
    const db = await this.getDb();
    return PipelineSnapshotSchema.array()
      .parse(db.data.snapshots)
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
}
