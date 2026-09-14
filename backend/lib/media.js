// Pure upload-validation helpers — no filesystem, no Express. Extracted so
// they're unit-testable without touching disk. SCRUM-87 (real file upload
// for observations, replacing the free-text media_url field).
import path from 'path';

export const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // generous for a single photo/short clip

export const isAllowedMimeType = (mimetype) =>
  ALLOWED_MIME_PREFIXES.some((prefix) => (mimetype || '').startsWith(prefix));

const EXT_BY_MIME = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
  'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a',
};

/** Picks a safe file extension for a stored upload — never trusts the client's original filename beyond its extension. */
export const extensionFor = (mimetype, originalName) => {
  if (EXT_BY_MIME[mimetype]) return EXT_BY_MIME[mimetype];
  const fromName = path.extname(originalName || '').toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(fromName) ? fromName : '';
};
