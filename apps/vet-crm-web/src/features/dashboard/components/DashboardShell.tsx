'use client';

import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopBar } from './DashboardTopBar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <DashboardTopBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DashboardSidebar />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
