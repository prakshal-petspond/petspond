'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { ConsultationBooking } from '@petspond/types';
import {
  avatarColorFor,
  ownerLabel,
  petInitials,
  scheduledRelativeHint,
  serviceLabel,
} from '../shared/utils';

export type SiblingPetHint = {
  name: string;
  breed: string;
};

type ConfirmCheckInModalProps = {
  open: boolean;
  booking: ConsultationBooking | null;
  /** Estimated queue position after check-in (1-based). */
  nextQueuePosition: number;
  siblingPets?: SiblingPetHint[];
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
  onAddAnotherPet?: () => void;
};

function formatTime12(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function formatOwnerPhone(booking: ConsultationBooking): string | null {
  const raw = (booking.userMobile ?? booking.ownerMobileSnapshot ?? '').replace(/\D/g, '');
  if (raw.length < 10) return null;
  const ten = raw.slice(-10);
  return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
}

function punctualityBadge(scheduledAt: string): { label: string; className: string } {
  const hint = scheduledRelativeHint(scheduledAt);
  if (hint.tone === 'late') {
    return { label: 'LATE', className: 'bg-error/15 text-error' };
  }
  if (hint.tone === 'soon' || hint.tone === 'muted') {
    return { label: 'EARLY', className: 'bg-brand-blue/10 text-brand-blue' };
  }
  return { label: 'ON TIME', className: 'bg-success/15 text-success' };
}

export function ConfirmCheckInModal({
  open,
  booking,
  nextQueuePosition,
  siblingPets = [],
  busy,
  error,
  onClose,
  onConfirm,
  onAddAnotherPet,
}: ConfirmCheckInModalProps) {
  if (!open || !booking) return null;

  const owner = ownerLabel(booking);
  const firstName = owner.split(/\s+/)[0] || owner;
  const phone = formatOwnerPhone(booking);
  const fromApp = Boolean(booking.userId) && !booking.isWalkIn;
  const punctuality = punctualityBadge(booking.scheduledAt);
  const doctor = booking.vetName ? `Dr. ${booking.vetName.replace(/^Dr\.?\s*/i, '')}` : 'Doctor';
  const appointmentLine = [
    formatTime12(booking.scheduledAt),
    serviceLabel(booking).replace(/\b\w/g, (c) => c.toUpperCase()),
    doctor,
  ].join(' · ');

  const siblingHint =
    siblingPets.length > 0
      ? `${firstName} has ${siblingPets.length} more pet${siblingPets.length === 1 ? '' : 's'} on file: ${siblingPets
          .slice(0, 2)
          .map((p) => `${p.name}${p.breed ? ` · ${p.breed}` : ''}`)
          .join(', ')}${siblingPets.length > 2 ? ` +${siblingPets.length - 2}` : ''} — one tap to add`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-checkin-title"
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="confirm-checkin-title" className="text-xl font-bold text-foreground">
            Confirm check-in
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1 text-muted hover:bg-background-muted hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold ${avatarColorFor(booking.id)}`}
          >
            {petInitials(booking.petName).slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">
              {booking.petName}
              {booking.petBreed ? ` · ${booking.petBreed}` : ''}
            </p>
            <p className="truncate text-sm text-muted">
              {owner}
              {phone ? ` · ${phone}` : ''}
            </p>
          </div>
          {fromApp ? (
            <span className="shrink-0 rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-blue">
              App
            </span>
          ) : booking.isWalkIn ? (
            <span className="shrink-0 rounded-full bg-background-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted">
              Walk-in
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-background-muted px-4 py-3">
          <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">{appointmentLine}</p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${punctuality.className}`}
          >
            {punctuality.label}
          </span>
        </div>

        {onAddAnotherPet ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={onAddAnotherPet}
              disabled={busy}
              className="w-full rounded-xl border border-dashed border-brand-blue/50 bg-card py-3 text-sm font-semibold text-brand-blue hover:bg-brand-blue/5 disabled:opacity-50"
            >
              + Add another pet for this visit
            </button>
            {siblingHint ? <p className="mt-2 text-center text-xs text-muted">{siblingHint}</p> : null}
          </div>
        ) : null}

        <div className="mt-4 rounded-xl bg-brand-blue/10 px-4 py-3 text-sm text-foreground">
          On confirm: <span className="font-semibold">{booking.petName}</span> joins Live Queue · Waiting
          (#{nextQueuePosition})
          {fromApp ? (
            <>
              {' '}
              and <span className="font-semibold">{firstName}&apos;s</span> app starts tracking the visit live.
            </>
          ) : (
            '.'
          )}
        </div>

        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl bg-background-muted px-4 py-3 text-sm font-semibold text-foreground hover:bg-border/60 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-success px-4 py-3 text-sm font-semibold text-on-contrast hover:bg-success-hover disabled:opacity-50"
          >
            {busy ? 'Checking in…' : 'Check in'}
          </button>
        </div>
      </div>
    </div>
  );
}
