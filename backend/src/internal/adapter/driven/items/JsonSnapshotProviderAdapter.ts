import type { Item } from '../../../core/entity/Item.ts';
import type { ItemsProviderPort } from '../../../core/port/ItemsProviderPort.ts';

export class JsonSnapshotProviderAdapter implements ItemsProviderPort {
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
