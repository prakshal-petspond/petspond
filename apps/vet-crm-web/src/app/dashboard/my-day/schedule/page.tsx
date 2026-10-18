'use client';

import Link from 'next/link';
import { useDashboard } from '@/features/dashboard/DashboardContext';
import { ROLE_NAV_ACCESS } from '@/features/dashboard/roles';

export default function MyDaySchedulePage() {
  const { role } = useDashboard();
  const access = ROLE_NAV_ACCESS[role];

  if (!access.myDay) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-muted">Schedule is available to veterinarians and clinic admins.</p>
        <Link href="/dashboard" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to overview
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
      <p className="mt-2 max-w-md text-muted">
        Your full day calendar will live here. Use Quick View for today&apos;s board in the meantime.
      </p>
      <Link
        href="/dashboard/my-day"
        className="mt-6 text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to Quick View
      </Link>
    </div>
  );
}
