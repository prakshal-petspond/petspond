'use client';

import { flushSync } from 'react-dom';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { Vet, VetPendingClinicInvite } from '@petspond/types';
import type { ApiClient } from '@petspond/api-client';
import { getVetPostAuthPath } from '@/lib/vetRouting';

export function completeVetAuth(
  router: AppRouterInstance,
  setAuthTokens: (accessToken: string | null, refreshToken?: string | null) => void,
  data: {
    accessToken?: string;
    refreshToken?: string;
    token?: string;
    vet: Vet;
    pendingClinicInvite?: VetPendingClinicInvite | null;
  },
) {
  const accessToken = data.accessToken ?? data.token;
  if (!accessToken || !data.refreshToken) {
    throw new Error('Missing auth tokens');
  }
  flushSync(() => {
    setAuthTokens(accessToken, data.refreshToken);
  });
  router.replace(getVetPostAuthPath(data.vet, data.pendingClinicInvite ?? undefined));
}

export function authErrorMessage(err: unknown, fallback: string): string {
  const apiErr = err as { statusCode?: number; message?: string };
  if (apiErr?.statusCode === 404) {
    return 'Backend not reachable. Start the API: pnpm --filter @petspond/api dev';
  }
  if (
    typeof apiErr?.message === 'string' &&
    /failed to fetch|network error|load failed/i.test(apiErr.message)
  ) {
    return 'Cannot reach API. Check NEXT_PUBLIC_API_URL and that the API is running.';
  }
  return apiErr?.message ?? fallback;
}

export type AuthClient = ApiClient;
