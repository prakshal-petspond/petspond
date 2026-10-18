'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import type { ConsultationBooking } from '@petspond/types';
import { ownerLabel } from '../shared/utils';

type CheckInSuccessModalProps = {
  open: boolean;
  booking: ConsultationBooking | null;
  queuePosition: number;
  estimatedWithDoctor: string;
  onViewQueue: () => void;
  onDone: () => void;
};

export function CheckInSuccessModal({
  open,
  booking,
  queuePosition,
  estimatedWithDoctor,
  onViewQueue,
  onDone,
}: CheckInSuccessModalProps) {
  if (!open || !booking) return null;

  const owner = ownerLabel(booking);
  const firstName = owner.split(/\s+/)[0] || owner;
  const fromApp = Boolean(booking.userId) && !booking.isWalkIn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-success-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-card px-6 pb-6 pt-8 shadow-xl"
      >
        <button
          type="button"
          onClick={onDone}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:bg-background-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="h-7 w-7 stroke-[2.5]" />
          </span>
          <h2 id="checkin-success-title" className="mt-4 text-xl font-bold text-foreground">
            {booking.petName} is checked in
          </h2>
          <p className="mt-2 text-sm font-semibold text-foreground">
            Added to Live Queue · Waiting · #{queuePosition} in line
          </p>
          <p className="mt-1 text-sm text-muted">Estimated with doctor: ~{estimatedWithDoctor}</p>
        </div>

        {fromApp ? (
          <div className="mt-5 rounded-xl bg-brand-blue/10 px-4 py-3 text-center text-sm font-medium text-foreground">
            {firstName}&apos;s app is now tracking this visit live
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-brand-blue/10 px-4 py-3 text-center text-sm font-medium text-foreground">
            {booking.petName} is in the waiting room
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onViewQueue}
            className="rounded-xl bg-brand-blue px-4 py-3 text-sm font-semibold text-white hover:bg-brand-blue-hover"
          >
            View in Queue
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl bg-background-muted px-4 py-3 text-sm font-semibold text-foreground hover:bg-border/60"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
