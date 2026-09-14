import { describe, it, expect } from 'vitest';
import { isAllowedMimeType, extensionFor, MAX_UPLOAD_BYTES, ALLOWED_MIME_PREFIXES } from './media.js';

describe('isAllowedMimeType', () => {
  it('accepts images, video, and audio', () => {
    expect(isAllowedMimeType('image/jpeg')).toBe(true);
    expect(isAllowedMimeType('video/mp4')).toBe(true);
    expect(isAllowedMimeType('audio/webm')).toBe(true);
  });
  it('rejects everything else', () => {
    expect(isAllowedMimeType('application/pdf')).toBe(false);
    expect(isAllowedMimeType('text/html')).toBe(false);
    expect(isAllowedMimeType(undefined)).toBe(false);
    expect(isAllowedMimeType('')).toBe(false);
  });
});

describe('extensionFor', () => {
  it('maps known mime types to a safe extension', () => {
    expect(extensionFor('image/png', 'whatever.exe')).toBe('.png');
    expect(extensionFor('audio/webm', 'blob')).toBe('.webm');
  });
  it('falls back to the original filename extension for unmapped mime types', () => {
    expect(extensionFor('image/bmp', 'photo.bmp')).toBe('.bmp');
  });
  it('never trusts a weird or missing original filename', () => {
    expect(extensionFor('image/bmp', undefined)).toBe('');
    expect(extensionFor('image/bmp', 'no-extension')).toBe('');
    expect(extensionFor('image/bmp', '../../etc/passwd')).toBe('');
  });
});

describe('sanity constants', () => {
  it('keeps a positive upload size limit and a non-empty prefix allowlist', () => {
    expect(MAX_UPLOAD_BYTES).toBeGreaterThan(0);
    expect(ALLOWED_MIME_PREFIXES.length).toBeGreaterThan(0);
  });
});
