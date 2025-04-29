import { describe, test, expect, vi } from 'vitest';
import { NodeFetchAdapter } from './NodeFetchAdapter';

describe('NodeFetchAdapter', () => {
  test('delegates fetch call to injected fetch function', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"success":true}', { status: 200 }));
    const adapter = new NodeFetchAdapter(fetchMock);
    const response = await adapter.fetch('https://example.com', {
      method: 'GET',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
      method: 'GET',
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true });
  });
});
