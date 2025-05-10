import type { FetchPort } from '../../../core/port/FetchPort.ts';

export class NodeFetchAdapter implements FetchPort {
  private readonly fetchFn: typeof fetch;

  constructor(fetchFn: typeof fetch) {
    this.fetchFn = fetchFn;
  }

  fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.fetchFn(input, init);
  }
}
