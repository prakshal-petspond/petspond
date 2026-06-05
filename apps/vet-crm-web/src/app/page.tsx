'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi, getStoredVetToken } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
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
      .then(setVet)
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
  if (!vet.onboardingCompleted) {
    router.replace('/onboarding/about-you');
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted">Redirecting to onboarding...</p>
      </main>
    );
  }

  router.replace('/dashboard');
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <h1 className="text-3xl font-bold text-primary mb-4">Petspond Vet CRM</h1>
      <p className="text-muted mb-8">Redirecting to dashboard...</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
