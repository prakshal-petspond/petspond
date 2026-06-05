const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function uploadVendorPhoto(
  accessToken: string | null,
  localUri: string,
): Promise<string> {
  const filename = localUri.split('/').pop() ?? 'profile.jpg';
  const ext = filename.split('.').pop()?.toLowerCase();
  const mime =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'heic' ? 'image/heic' : 'image/jpeg';

  const form = new FormData();
  form.append('file', { uri: localUri, name: filename, type: mime } as unknown as Blob);

  const res = await fetch(`${API_BASE}/vendor-auth/upload-photo`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? res.statusText ?? 'Photo upload failed');
  }
  if (!data.url) throw new Error('Photo upload did not return a URL');
  return data.url;
}
