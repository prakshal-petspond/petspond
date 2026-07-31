'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Queue is now part of the unified Front Desk board. */
export default function DashboardQueuePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/check-in');
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <p className="text-muted">Opening Front Desk…</p>
    </div>
  );
}
