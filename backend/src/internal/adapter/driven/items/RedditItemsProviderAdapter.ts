import type { Item } from '../../../core/entity/Item.ts';
import type { FetchPort } from '../../../core/port/FetchPort.ts';
import type { ItemsProviderPort } from '../../../core/port/ItemsProviderPort.ts';
import { fetchRedditItems } from './fetchRedditItems.ts';

export class RedditItemsProviderAdapter implements ItemsProviderPort {
  constructor(
    private readonly fetcher: FetchPort,
    private readonly url: string,
  ) {}

  async getItems(): Promise<Item[]> {
    return fetchRedditItems(this.fetcher, this.url);
  }

  getLabel(): string {
    return this.url;
  }

  getCreatedAt(): string | null {
    return null;
  }
}
