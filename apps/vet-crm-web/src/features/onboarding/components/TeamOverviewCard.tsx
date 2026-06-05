'use client';

import React from 'react';

type TeamOverviewCardProps = {
  vetCount: number;
  staffCount: number;
  clinicName: string;
};

export function TeamOverviewCard({ vetCount, staffCount, clinicName }: TeamOverviewCardProps) {
  const total = vetCount + staffCount;

  return (
    <section className="rounded-2xl border border-input-border/50 bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground">
        {total === 0 ? '0 team members configured' : `${total} team member${total === 1 ? '' : 's'} configured`}
      </p>
      <p className="mt-1 text-xs text-muted">
        Add your team members to collaborate and manage appointments at {clinicName || 'your clinic'}.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-input-border/40 bg-background/60 p-4">
          <div className="flex items-center gap-2 text-brand-blue">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-sm">
              🩺
            </span>
            <span className="text-xs font-bold uppercase tracking-wide">Veterinarians</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{vetCount}</p>
          <p className="text-xs text-muted">{vetCount === 0 ? 'No vet added yet' : 'Added to your clinic'}</p>
        </div>
        <div className="rounded-xl border border-input-border/40 bg-background/60 p-4">
          <div className="flex items-center gap-2 text-onboarding-accent">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-onboarding-accent/10 text-sm">
              🎧
            </span>
            <span className="text-xs font-bold uppercase tracking-wide">Front Office</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{staffCount}</p>
          <p className="text-xs text-muted">
            {staffCount === 0 ? 'No staff added yet' : 'Reception & appointments'}
          </p>
        </div>
      </div>
    </section>
  );
}
