'use client';

import React from 'react';
import Link from 'next/link';

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 max-w-md text-muted">{description}</p>
      <Link href="/dashboard" className="mt-6 text-sm font-semibold text-brand-blue hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}

export default function RecordsPage() {
  return (
    <PlaceholderPage title="Records" description="Medical records will be available here in a future update." />
  );
}
