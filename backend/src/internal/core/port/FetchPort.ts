export interface FetchPort {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}
