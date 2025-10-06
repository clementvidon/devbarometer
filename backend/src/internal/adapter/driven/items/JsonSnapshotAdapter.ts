import type { Item } from '../../../core/entity';
import type { ItemsProviderPort } from '../../../core/port/ItemsProviderPort';

export class JsonSnapshotAdapter implements ItemsProviderPort {
  constructor(
    private readonly items: Item[],
    private readonly label: string,
    private readonly createdAt: string | null,
  ) {}

  async getItems(): Promise<Item[]> {
    return Promise.resolve(this.items);
  }

  getLabel(): string {
    return this.label;
  }

  getCreatedAt(): string | null {
    return this.createdAt;
  }
}
