'use client';

import React from 'react';
import Link from 'next/link';

export default function OwnersPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold text-foreground">Owners</h1>
      <p className="mt-2 max-w-md text-muted">Pet owner records will be listed here.</p>
      <Link href="/dashboard" className="mt-6 text-sm font-semibold text-brand-blue hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
