'use client';

import React from 'react';
import type { ConsultationBooking } from '@petspond/types';
import { avatarColorFor, formatTime, petInitials } from '../shared/utils';

type TodaySummaryProps = {
  arrived: number;
  waiting: number;
  noShow: number;
  recentlyCheckedIn: ConsultationBooking[];
};

export function TodaySummary({ arrived, waiting, noShow, recentlyCheckedIn }: TodaySummaryProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 font-bold text-foreground">Today</h2>
      <div className="mb-6 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-2xl font-bold text-success">{arrived}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Arrived</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-onboarding-accent">{waiting}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Waiting</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-error">{noShow}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">No-show</p>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-foreground">Recently checked in</h3>
      {recentlyCheckedIn.length === 0 ? (
        <p className="text-sm text-muted">No check-ins yet today.</p>
      ) : (
        <ul className="space-y-3">
          {recentlyCheckedIn.map((b) => (
            <li key={b.id} className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColorFor(b.id)}`}
              >
                {petInitials(b.petName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{b.petName}</p>
                <p className="text-xs text-muted">
                  Checked in {b.checkedInAt ? formatTime(b.checkedInAt) : '—'}
                  {b.roomLabel ? ` · ${b.roomLabel}` : ''}
                </p>
              </div>
              <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
