'use client';

import React from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-2 max-w-md text-muted">Clinic and account settings will be available here.</p>
      <Link href="/dashboard/legacy?tab=clinic" className="mt-4 text-sm font-semibold text-brand-blue hover:underline">
        Edit clinic profile
      </Link>
      <Link href="/dashboard" className="mt-4 block text-sm font-semibold text-muted hover:text-foreground">
        ← Back to dashboard
      </Link>
    </div>
  );
}
