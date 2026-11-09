// Uploads live in a private container, so direct blob URLs return 403; serve them through /api/media instead.
const BLOB_URL = /https:\/\/[a-z0-9]{3,24}\.blob\.core\.windows\.net\/[a-z0-9-]{3,63}\/([A-Za-z0-9][A-Za-z0-9.-]{0,300}\.(?:jpe?g|png|webp|mp4|pdf|pptx?))(?:\?[^"\s)]*)?/gi;
const LOCAL_UPLOAD_URL = /(["(])\/uploads\/([A-Za-z0-9][A-Za-z0-9.-]{0,300}\.(?:jpe?g|png|webp|mp4|pdf|pptx?))(?:\?[^"\s)]*)?/gi;

export function toMediaUrls<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replace(BLOB_URL, '/api/media/$1').replace(LOCAL_UPLOAD_URL, '$1/api/media/$2')) as T;
}
