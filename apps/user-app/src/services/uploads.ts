import { resolvePhotoUrl } from '@/lib/photoUrl';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function uploadPetPhoto(
  accessToken: string | null,
  localUri: string,
): Promise<string> {
  const filename = localUri.split('/').pop() ?? 'pet.jpg';
  const ext = filename.split('.').pop()?.toLowerCase();
  const mime =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'heic' ? 'image/heic' : 'image/jpeg';

  const form = new FormData();
  form.append('file', { uri: localUri, name: filename, type: mime } as unknown as Blob);

  const res = await fetch(`${API_BASE}/user/uploads/pet-photo`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as { url?: string; key?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? res.statusText ?? 'Photo upload failed');
  }
  if (data.key) {
    const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return `${base}/public/files/${data.key}`;
  }
  if (data.url) return resolvePhotoUrl(data.url) ?? data.url;
  throw new Error('Photo upload did not return a URL');
}
