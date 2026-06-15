'use client';

import React from 'react';
import type { ConsultationBooking } from '@petspond/types';
import {
  avatarColorFor,
  ownerLabel,
  petInitials,
  formatTime,
  scheduledRelativeHint,
} from '../shared/utils';

type ArrivalRowProps = {
  booking: ConsultationBooking;
  onCheckIn: (id: string) => void;
  busy?: boolean;
};

export function ArrivalRow({ booking, onCheckIn, busy }: ArrivalRowProps) {
  const hint = scheduledRelativeHint(booking.scheduledAt);
  const hintClass =
    hint.tone === 'late'
      ? 'text-error'
      : hint.tone === 'now'
        ? 'text-brand-blue'
        : 'text-muted';

  return (
    <li className="flex items-center gap-4 border-b border-border/60 px-5 py-4 last:border-0">
      <div className="w-16 shrink-0">
        <p className="font-semibold text-foreground">{formatTime(booking.scheduledAt)}</p>
        <p className={`text-xs font-medium ${hintClass}`}>{hint.label}</p>
      </div>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColorFor(booking.id)}`}
      >
        {petInitials(booking.petName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{booking.petName}</p>
        <p className="text-sm text-muted">
          {booking.petBreed} · {ownerLabel(booking)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onCheckIn(booking.id)}
        disabled={busy}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:bg-success/90 disabled:opacity-50"
      >
        <span aria-hidden>✓</span> Check in
      </button>
    </li>
  );
}
