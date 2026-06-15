'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { ApiClient } from '@petspond/api-client';
import { getStoredVetRefreshToken } from '@/contexts/ApiContext';
import { vetAuthApi } from '@/services/vet-auth.service';

export async function signOutVet(
  client: ApiClient,
  clearAuth: () => void,
  router: AppRouterInstance,
) {
  const refreshToken = getStoredVetRefreshToken();
  if (refreshToken) {
    await vetAuthApi.logout(client, refreshToken).catch(() => undefined);
  }
  clearAuth();
  router.replace('/login');
}
