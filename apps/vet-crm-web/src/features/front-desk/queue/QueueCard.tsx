'use client';

import React from 'react';
import type { ConsultationBooking } from '@petspond/types';
import { avatarColorFor, formatMoney, petInitials, waitMinutesSince } from '../shared/utils';

type QueueCardProps = {
  booking: ConsultationBooking;
  variant: 'waiting' | 'in_consultation' | 'ready_checkout';
  onAdvance?: (id: string) => void;
  busy?: boolean;
};

function waitTone(minutes: number): string {
  if (minutes >= 15) return 'text-error';
  if (minutes >= 8) return 'text-onboarding-accent';
  return 'text-muted';
}

export function QueueCard({ booking, variant, onAdvance, busy }: QueueCardProps) {
  const waitMin =
    variant === 'in_consultation'
      ? waitMinutesSince(booking.consultationStartedAt)
      : waitMinutesSince(booking.checkedInAt);

  const actionLabel =
    variant === 'waiting'
      ? 'Start consult'
      : variant === 'in_consultation'
        ? 'Ready for checkout'
        : null;

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColorFor(booking.id)}`}
        >
          {petInitials(booking.petName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{booking.petName}</p>
          <p className="text-xs text-muted">{booking.petBreed}</p>
        </div>
        <button type="button" className="text-muted hover:text-foreground" aria-label="More options">
          ⋯
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">
          {booking.vetName ?? 'Unassigned'}
          {booking.roomLabel ? ` · ${booking.roomLabel}` : ''}
        </span>
        {variant === 'ready_checkout' ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              booking.paymentStatus === 'paid'
                ? 'bg-success/15 text-success'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {booking.paymentStatus === 'paid' ? 'Paid' : formatMoney(booking.totalPaise) + ' due'}
          </span>
        ) : (
          <span className={`font-semibold ${waitTone(waitMin)}`}>{waitMin} min</span>
        )}
      </div>

      {actionLabel && onAdvance ? (
        <button
          type="button"
          onClick={() => onAdvance(booking.id)}
          disabled={busy}
          className="mt-3 w-full rounded-lg border border-brand-blue/30 bg-brand-blue/5 py-2 text-xs font-semibold text-brand-blue hover:bg-brand-blue/10 disabled:opacity-50"
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}
