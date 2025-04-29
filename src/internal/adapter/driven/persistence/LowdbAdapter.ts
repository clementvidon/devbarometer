import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import type { PipelineSnapshot } from '../../../core/types/PipelineSnapshot';

type Data = {
  snapshots: PipelineSnapshot[];
};

type DbType = ReturnType<typeof JSONFilePreset<Data>>;

const DB_PATH = 'db.json';

const defaultData: Data = {
  snapshots: [],
} as const;

export class LowdbAdapter {
  private dbPromise: Promise<Awaited<DbType>>;

  constructor() {
    this.dbPromise = JSONFilePreset<Data>(DB_PATH, defaultData);
  }

  private async getDb(): Promise<Awaited<DbType>> {
    return this.dbPromise;
  }

  async storeSnapshot(
    snapshot: Omit<PipelineSnapshot, 'id' | 'createdAt'>,
  ): Promise<void> {
    const db = await this.getDb();
    db.data.snapshots.push({
      ...snapshot,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    });
    await db.write();
  }

  async getSnapshots(): Promise<PipelineSnapshot[]> {
    const db = await this.getDb();
    return db.data.snapshots;
  }
}
