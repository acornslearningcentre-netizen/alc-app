import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// API_BASE is computed once at module load from import.meta.env, so each
// case needs a fresh module import after stubbing the env var.
describe('apiUrl', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefixes the path with VITE_API_BASE_URL when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://alc-app-production.up.railway.app');
    const { apiUrl } = await import('./api-base');
    expect(apiUrl('/api/health')).toBe('https://alc-app-production.up.railway.app/api/health');
  });

  it('strips a trailing slash off the configured base', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://example.com/');
    const { apiUrl } = await import('./api-base');
    expect(apiUrl('/api/health')).toBe('https://example.com/api/health');
  });

  it('leaves the path unprefixed (relative) when unset', async () => {
    // No stubEnv call — relies on VITE_API_BASE_URL being unset in the test env.
    const { apiUrl } = await import('./api-base');
    expect(apiUrl('/api/health')).toBe('/api/health');
  });
});
