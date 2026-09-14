import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildReportEmail, sendReportEmail } from './report-email.js';

describe('buildReportEmail', () => {
  it('greets the parent by name when known', () => {
    const { html, text } = buildReportEmail({ parentName: 'Jamie', childFirstName: 'Verifina', reportText: 'All good.' });
    expect(html).toContain('Hi Jamie,');
    expect(text).toContain('Hi Jamie,');
  });

  it('falls back to a generic greeting and child reference when nothing is on file', () => {
    const { html, subject } = buildReportEmail({ parentName: null, childFirstName: null, reportText: 'All good.' });
    expect(html).toContain('Hi,');
    expect(html).toContain('your child');
    expect(subject).toContain("your child's assessment report");
  });

  it('carries the real report text into the email body, not generic filler', () => {
    const { html, text } = buildReportEmail({ parentName: 'Jamie', childFirstName: 'Verifina', reportText: 'Loves the bead chains.' });
    expect(html).toContain('Loves the bead chains.');
    expect(text).toContain('Loves the bead chains.');
  });
});

describe('sendReportEmail', () => {
  const OLD_ENV = process.env;
  beforeEach(() => { process.env = { ...OLD_ENV }; });
  afterEach(() => { process.env = OLD_ENV; vi.restoreAllMocks(); });

  it('throws a clear error when RESEND_API_KEY is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    await expect(sendReportEmail({ to: 'a@b.com', reportText: 'x' })).rejects.toThrow(/RESEND_API_KEY/);
  });
});
