import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import type { PersistencePort } from '../../../../internal/core/port/PersistencePort';
import type {
  PipelineSnapshot,
  SnapshotData,
} from '../../../core/types/PipelineSnapshot';

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
    db.data.snapshots.push({
      id: uuidv4(),
      createdAt: new Date(createdAtISO).toISOString(),
      ...snapshot,
    });
    await db.write();
  }

  async getSnapshots(): Promise<PipelineSnapshot[]> {
    const db = await this.getDb();
    return db.data.snapshots
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
}
