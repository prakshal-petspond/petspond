'use client';

import React from 'react';
import { PetspondLogo } from '@/components/PetspondLogo';
import { useDashboard, vetInitials } from '../DashboardContext';

export function DashboardTopBar() {
  const { vet, signOut } = useDashboard();
  const name = vet?.fullName?.trim() || 'Doctor';
  const role = vet?.isClinicAdmin ? 'Admin' : 'Veterinarian';

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <PetspondLogo href="/dashboard" imageClassName="h-8 w-auto" />
        <span className="hidden text-sm text-muted sm:inline">Petspond / Vet CRM</span>
      </div>

      <div className="mx-auto hidden max-w-xl flex-1 md:block">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            type="search"
            placeholder="Search pets, owners, appointments…"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <button type="button" className="relative rounded-lg p-2 text-muted hover:bg-background-muted" aria-label="Notifications">
          🔔
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-onboarding-accent" />
        </button>
        <button type="button" className="hidden rounded-lg p-2 text-muted hover:bg-background-muted sm:block" aria-label="Help">
          ?
        </button>
        <div className="flex items-center gap-2 border-l border-border pl-3 sm:pl-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
            {vetInitials(name)}
          </span>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted">{role}</p>
          </div>
          <button type="button" onClick={signOut} className="ml-1 text-xs text-muted hover:text-foreground sm:ml-2">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
