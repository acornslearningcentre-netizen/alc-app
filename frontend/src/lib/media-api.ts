// Client for the real media upload backend (SCRUM-87). Used by observation
// capture to store an actual photo/video/voice recording, not a fake path.
import { apiUrl } from './api-base';

export interface UploadedMedia {
  url: string;
  mime_type: string;
  size_bytes: number;
}

/** POST /api/media/upload (multipart) — stores a real file, returns its address. */
export const uploadMedia = async (file: Blob, filename: string): Promise<UploadedMedia> => {
  const form = new FormData();
  form.append('file', file, filename);
  const res = await fetch(apiUrl('/api/media/upload'), { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Upload failed (${res.status}).`);
  return body as UploadedMedia;
};
