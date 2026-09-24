import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateReportDraft } from './child-report.js';

describe('generateReportDraft', () => {
  const OLD_ENV = process.env;
  beforeEach(() => { process.env = { ...OLD_ENV }; });
  afterEach(() => { process.env = OLD_ENV; vi.restoreAllMocks(); });

  it('throws a clear error when ANTHROPIC_API_KEY is not configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(generateReportDraft({
      childName: 'Verifina', periodLabel: 'September 2026', observations: [], progress: null,
    })).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
