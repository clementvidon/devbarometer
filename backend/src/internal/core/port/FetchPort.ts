export interface FetchPort {
  fetch(_input: RequestInfo, _init?: RequestInit): Promise<Response>;
}
