'use client';

import React from 'react';
import type { ConsultationBooking } from '@petspond/types';
import { ArrivalRow } from './ArrivalRow';

type ExpectedArrivalsProps = {
  arrivals: ConsultationBooking[];
  bookedToday: number;
  waitingToCheckIn: number;
  onCheckIn: (id: string) => void;
  checkingId?: string | null;
};

export function ExpectedArrivals({
  arrivals,
  bookedToday,
  waitingToCheckIn,
  onCheckIn,
  checkingId,
}: ExpectedArrivalsProps) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-foreground">Expected Arrivals</h2>
            <span className="rounded-full bg-background-muted px-2.5 py-0.5 text-xs font-semibold text-muted">
              Today
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {bookedToday} booked today · {waitingToCheckIn} waiting to check in
          </p>
        </div>
      </div>
      {arrivals.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">No arrivals waiting for check-in.</p>
      ) : (
        <ul>
          {arrivals.map((b) => (
            <ArrivalRow
              key={b.id}
              booking={b}
              onCheckIn={onCheckIn}
              busy={checkingId === b.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
