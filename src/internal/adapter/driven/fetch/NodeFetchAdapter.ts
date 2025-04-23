import type { FetchPort } from '../../../core/port/FetchPort';

export class NodeFetchAdapter implements FetchPort {
  constructor(private readonly fn: typeof fetch) {}

  fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.fn(input, init);
  }
}
