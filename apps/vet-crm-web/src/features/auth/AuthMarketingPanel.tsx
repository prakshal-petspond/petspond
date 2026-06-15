'use client';

import React from 'react';
import { PetspondLogo } from '@/components/PetspondLogo';

const FEATURES = [
  'Manage appointments across every vet',
  'Medical records & client history in one place',
  'Payments, analytics & clinic insights',
];

export function AuthMarketingPanel() {
  return (
    <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-brand-blue p-8 text-white lg:min-h-screen lg:p-12">
      <div className="pointer-events-none absolute -bottom-16 -right-10 opacity-10">
        <svg width="220" height="220" viewBox="0 0 120 120" fill="currentColor" aria-hidden>
          <circle cx="30" cy="24" r="10" />
          <circle cx="18" cy="48" r="8" />
          <circle cx="42" cy="48" r="8" />
          <circle cx="24" cy="68" r="7" />
          <circle cx="38" cy="68" r="7" />
        </svg>
      </div>

      <div>
        <PetspondLogo href="/" imageClassName="h-9 w-auto brightness-0 invert" />
        <p className="mt-1 text-sm text-white/80">Vet CRM</p>
      </div>

      <div className="my-10 max-w-md">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Run your clinic, not the chaos.
        </h1>
        <p className="mt-4 text-base text-white/85">
          One workspace for appointments, patient records, billing and your whole care team.
        </p>
        <ul className="mt-8 space-y-4">
          {FEATURES.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-white/90">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
        <p className="text-3xl font-bold">12,400+</p>
        <p className="mt-1 text-sm text-white/85">
          appointments managed by Petspond clinics this month
        </p>
      </div>
    </div>
  );
}
