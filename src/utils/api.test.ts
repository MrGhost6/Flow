import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sets Content-Type header by default', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', mockFetch);

    const { apiFetch } = await import('./api');
    await apiFetch('/test');

    const options = mockFetch.mock.calls[0][1];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('adds Authorization header when token is in localStorage', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', mockFetch);
    localStorage.setItem('flow_accessToken', 'test-token');

    const { apiFetch } = await import('./api');
    await apiFetch('/test');

    const options = mockFetch.mock.calls[0][1];
    expect(options.headers['Authorization']).toBe('Bearer test-token');
  });

  it('does not add Authorization header when no token is stored', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', mockFetch);

    const { apiFetch } = await import('./api');
    await apiFetch('/test');

    const options = mockFetch.mock.calls[0][1];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('preserves custom headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', mockFetch);

    const { apiFetch } = await import('./api');
    await apiFetch('/test', { headers: { 'X-Custom': 'value' } });

    const options = mockFetch.mock.calls[0][1];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['X-Custom']).toBe('value');
  });
});
