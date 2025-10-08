import type { FetchPort } from '../../application/ports/FetchPort';

export class NodeFetchAdapter implements FetchPort {
  constructor(private readonly fetchFn: typeof fetch) {}

  fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.fetchFn(input, init);
  }
}
