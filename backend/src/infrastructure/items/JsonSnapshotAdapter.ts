import type { ItemsProviderPort } from '../../application/ports/output/ItemsProviderPort';
import type { Item } from '../../domain/entities';

export class JsonSnapshotAdapter implements ItemsProviderPort {
  constructor(
    private readonly items: Item[],
    private readonly createdAt: string | null,
  ) {}

  async getItems(): Promise<Item[]> {
    return Promise.resolve(this.items);
  }

  getCreatedAt(): string | null {
    return this.createdAt;
  }
}
