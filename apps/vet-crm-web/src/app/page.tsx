'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, getStoredVetToken } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { getVetPostAuthPath } from '@/lib/vetRouting';
import type { Vet } from '@petspond/types';

export default function HomePage() {
  const router = useRouter();
  const { client, token } = useApi();
  const [vet, setVet] = useState<Vet | null | undefined>(undefined);

  useEffect(() => {
    const effectiveToken = token ?? getStoredVetToken();
    if (!effectiveToken) {
      router.replace('/login');
      return;
    }
    vetAuthApi
      .me(client)
      .then(async (v) => {
        const pending = await vetAuthApi.getPendingClinicInvite(client).catch(() => null);
        router.replace(getVetPostAuthPath(v, pending));
        setVet(v);
      })
      .catch(() => {
        setVet(null);
      });
  }, [token, client, router]);

  if (vet === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }
  if (!vet) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted">Session expired. Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted">Redirecting…</p>
    </main>
  );
}
