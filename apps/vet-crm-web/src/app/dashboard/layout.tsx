'use client';

import React from 'react';
import { DashboardProvider, useDashboard } from '@/features/dashboard/DashboardContext';
import { DashboardShell } from '@/features/dashboard/components/DashboardShell';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  );
}
