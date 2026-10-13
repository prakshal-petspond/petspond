import type { ApiClient } from '@petspond/api-client';

export function uploadPetPhoto(client: ApiClient, localUri: string, mimeType?: string) {
  const name = localUri.split('/').pop() || 'pet.jpg';
  const type = mimeType || (name.endsWith('.png') ? 'image/png' : 'image/jpeg');
  const form = new FormData();
  form.append('file', { uri: localUri, name, type } as unknown as Blob);
  return client.postForm<{ url: string; key: string }>('/user/uploads/pet-photo', form);
}
