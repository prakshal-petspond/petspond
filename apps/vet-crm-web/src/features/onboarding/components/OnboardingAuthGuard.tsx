'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredVetToken, useApi } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { getVetPostAuthPath } from '@/lib/vetRouting';

export function OnboardingAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { client } = useApi();

  useEffect(() => {
    if (!getStoredVetToken()) {
      router.replace('/login');
      return;
    }
    void (async () => {
      try {
        const vet = await vetAuthApi.me(client);
        const pending = await vetAuthApi.getPendingClinicInvite(client);
        const path = getVetPostAuthPath(vet, pending);
        if (path === '/join-clinic') {
          router.replace('/join-clinic');
        } else if (path === '/dashboard') {
          router.replace('/dashboard');
        }
      } catch {
        router.replace('/login');
      }
    })();
  }, [client, router]);

  return <>{children}</>;
}
