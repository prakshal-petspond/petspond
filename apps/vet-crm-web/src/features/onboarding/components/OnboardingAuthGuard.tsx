'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredVetToken } from '@/contexts';

export function OnboardingAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getStoredVetToken()) {
      router.replace('/login');
    }
  }, [router]);

  return <>{children}</>;
}
