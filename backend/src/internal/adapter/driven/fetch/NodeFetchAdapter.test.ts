import { describe, expect, test, vi } from 'vitest';
import { NodeFetchAdapter } from './NodeFetchAdapter.ts';

describe('NodeFetchAdapter', () => {
  test('delegates fetch call to injected fetch function', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"success":true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const adapter = new NodeFetchAdapter(fetchMock);
    const response = await adapter.fetch('https://example.com', {
      method: 'GET',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
      method: 'GET',
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { success: boolean };
    expect(body).toEqual({ success: true });
  });

  test('propagates fetch errors', async () => {
    const err = new Error('network');
    const fetchMock = vi.fn().mockRejectedValue(err);
    const adapter = new NodeFetchAdapter(fetchMock);

    await expect(adapter.fetch('https://example.com')).rejects.toThrow(
      'network',
    );
  });
});
