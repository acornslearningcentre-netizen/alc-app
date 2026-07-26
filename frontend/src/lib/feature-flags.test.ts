import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// featureFlags.showV1 is computed once at module load from import.meta.env,
// so each case needs a fresh module import after stubbing the env var.
describe('featureFlags.showV1', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is false when VITE_SHOW_V1 is unset (the safe default)', async () => {
    // No stubEnv call — relies on VITE_SHOW_V1 being unset in the test env.
    const { featureFlags } = await import('./feature-flags');
    expect(featureFlags.showV1).toBe(false);
  });

  it.each(['1', 'true', 'TRUE', 'yes', 'on'])('is true for VITE_SHOW_V1=%s', async (value) => {
    vi.stubEnv('VITE_SHOW_V1', value);
    const { featureFlags } = await import('./feature-flags');
    expect(featureFlags.showV1).toBe(true);
  });

  it.each(['0', 'false', 'no', 'off', 'nonsense'])('is false for VITE_SHOW_V1=%s', async (value) => {
    vi.stubEnv('VITE_SHOW_V1', value);
    const { featureFlags } = await import('./feature-flags');
    expect(featureFlags.showV1).toBe(false);
  });
});
