import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import type { PipelineSnapshot } from '../../../core/types/PipelineSnapshot.ts';

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
    try {
      const db = await this.getDb();
      db.data.snapshots.push({
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        ...snapshot,
      });
      await db.write();
    } catch (err) {
      console.error('[LowdbAdapter] Failed to store snapshot:', err);
    }
  }

  async getSnapshots(): Promise<PipelineSnapshot[]> {
    const db = await this.getDb();
    return db.data.snapshots;
  }
}
