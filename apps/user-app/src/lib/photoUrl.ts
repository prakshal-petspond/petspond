const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/**
 * Resolves pet/vendor photo URLs for display on device.
 * Rewrites legacy private R2 URLs and localhost URLs to the current API base.
 */
export function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl?.trim()) return null;

  let key: string | null = null;

  const filesMarker = '/public/files/';
  const filesIdx = photoUrl.indexOf(filesMarker);
  if (filesIdx >= 0) {
    key = photoUrl.slice(filesIdx + filesMarker.length).split('?')[0];
  } else {
    const r2Match = photoUrl.match(/\.r2\.cloudflarestorage\.com\/(.+)$/);
    if (r2Match) {
      key = r2Match[1].split('?')[0];
    } else if (/^(pets|vendors|vets)\//.test(photoUrl)) {
      key = photoUrl.split('?')[0];
    }
  }

  if (key) return `${API_BASE}/public/files/${key}`;
  return photoUrl;
}
