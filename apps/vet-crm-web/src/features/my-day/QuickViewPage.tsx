'use client';

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import type { ConsultationBooking } from '@petspond/types';
import { frontDeskApi } from '@/services/front-desk.service';
import { useFrontDeskData } from '@/features/front-desk/shared/useFrontDeskData';
import {
  avatarColorFor,
  ownerLabel,
  petInitials,
  serviceLabel,
  waitMinutesSince,
} from '@/features/front-desk/shared/utils';
import { isToday, useDashboard } from '@/features/dashboard/DashboardContext';
import { ROLE_NAV_ACCESS } from '@/features/dashboard/roles';

function greetingForNow(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDaySubtitle(d = new Date()): string {
  return `${d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })} · your patients and records for today`;
}

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

function formatClock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function doctorDisplayName(fullName?: string | null): string {
  const n = (fullName ?? '').trim();
  if (!n) return 'Doctor';
  return n.replace(/^Dr\.?\s*/i, '');
}

export function QuickViewPage() {
  const { vet, role, consultations, loading: ctxLoading } = useDashboard();
  const access = ROLE_NAV_ACCESS[role];

  const { data: queue, loading: queueLoading } = useFrontDeskData(
    useCallback((c) => frontDeskApi.getQueue(c), []),
  );

  const mine = useCallback(
    (b: ConsultationBooking) => {
      if (!vet?.id) return false;
      return b.vetId === vet.id;
    },
    [vet?.id],
  );

  const myToday = useMemo(() => {
    const fromQueue = [
      ...(queue?.waiting ?? []),
      ...(queue?.inConsultation ?? []),
      ...(queue?.readyCheckout ?? []),
    ];
    const map = new Map<string, ConsultationBooking>();
    for (const b of [...fromQueue, ...consultations.filter((c) => isToday(c.scheduledAt))]) {
      if (!mine(b)) continue;
      map.set(b.id, b);
    }
    return [...map.values()].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [queue, consultations, mine]);

  const withMeNow = useMemo(
    () => myToday.find((b) => b.queueStatus === 'in_consultation') ?? null,
    [myToday],
  );

  const nextPatients = useMemo(
    () => myToday.filter((b) => b.queueStatus === 'waiting' || b.queueStatus === 'expected'),
    [myToday],
  );

  const seenCount = useMemo(
    () =>
      myToday.filter(
        (b) =>
          b.status === 'completed' ||
          b.queueStatus === 'ready_checkout' ||
          (b.queueStatus !== 'expected' &&
            b.queueStatus !== 'waiting' &&
            b.queueStatus !== 'in_consultation'),
      ).length,
    [myToday],
  );

  const toGoCount = useMemo(
    () =>
      myToday.filter(
        (b) =>
          b.queueStatus === 'waiting' ||
          b.queueStatus === 'expected' ||
          b.queueStatus === 'in_consultation',
      ).length,
    [myToday],
  );

  const recordsDueCount = useMemo(
    () =>
      myToday.filter(
        (b) =>
          b.queueStatus === 'ready_checkout' ||
          (b.status === 'completed' && !b.notes),
      ).length,
    [myToday],
  );

  const scheduleWindow = useMemo(() => {
    if (myToday.length === 0) return 'No appointments today';
    const first = myToday[0]!;
    const last = myToday[myToday.length - 1]!;
    const room = withMeNow?.roomLabel || myToday.find((b) => b.roomLabel)?.roomLabel || 'Clinic';
    return `${formatTime12(first.scheduledAt)} — ${formatTime12(last.scheduledAt)} · ${room}`;
  }, [myToday, withMeNow]);

  if (!access.myDay) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-muted">My Day is available to veterinarians and clinic admins.</p>
        <Link href="/dashboard" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to overview
        </Link>
      </div>
    );
  }

  if (ctxLoading || queueLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading your day…</p>
      </div>
    );
  }

  const vetName = doctorDisplayName(vet?.fullName);
  const consultMins = withMeNow?.consultationStartedAt
    ? waitMinutesSince(withMeNow.consultationStartedAt)
    : withMeNow?.checkedInAt
      ? waitMinutesSince(withMeNow.checkedInAt)
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {greetingForNow()}, Dr. {vetName}
            </h1>
            <p className="mt-1 text-sm text-muted">{formatDaySubtitle()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-success-muted px-3 py-1.5 text-xs font-bold text-success-foreground">
              {seenCount} seen
            </span>
            <span className="rounded-full bg-brand-blue/10 px-3 py-1.5 text-xs font-bold text-brand-blue">
              {toGoCount} to go
            </span>
            <span className="rounded-full bg-danger-muted px-3 py-1.5 text-xs font-bold text-danger-foreground">
              {recordsDueCount} records due
            </span>
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted hover:bg-background-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {recordsDueCount > 0 ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
              ) : null}
            </button>
          </div>
        </div>

        {withMeNow ? (
          <section className="rounded-2xl bg-brand-blue px-5 py-5 text-on-contrast shadow-sm sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              With me now
              {withMeNow.roomLabel ? ` · ${withMeNow.roomLabel}` : ''}
            </p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                  {petInitials(withMeNow.petName).slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold sm:text-2xl">
                    {withMeNow.petName}
                    {withMeNow.petBreed ? ` · ${withMeNow.petBreed}` : ''}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-white/85">
                    {[
                      ownerLabel(withMeNow),
                      withMeNow.petWeightLabel,
                      titleCase(serviceLabel(withMeNow)),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                    In consult{consultMins > 0 ? ` · ${consultMins} min` : ''}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-card px-4 py-2.5 text-sm font-semibold text-brand-blue hover:bg-white"
                >
                  Write clinical record
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-card px-4 py-2.5 text-sm font-semibold text-brand-blue hover:bg-white"
                >
                  + Prescription
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-card px-4 py-2.5 text-sm font-semibold text-brand-blue hover:bg-white"
                >
                  + Diagnostics
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center shadow-sm">
            <p className="font-semibold text-foreground">No patient in consultation</p>
            <p className="mt-1 text-sm text-muted">
              When front desk starts a consult with you, it will appear here.
            </p>
          </section>
        )}

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-foreground">My next patients</h2>
                  <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-blue">
                    {nextPatients.length} assigned to me
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Only pets routed to you — not the whole board
                </p>
              </div>
            </div>
            {nextPatients.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted">Queue is clear for you.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border/70">
                {nextPatients.slice(0, 8).map((b) => (
                  <li key={b.id} className="flex items-center gap-3 py-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColorFor(b.id)}`}
                    >
                      {petInitials(b.petName).slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {b.petName}
                        {b.petBreed ? ` · ${b.petBreed}` : ''}
                      </p>
                      <p className="truncate text-sm text-muted">
                        {ownerLabel(b)} · {titleCase(serviceLabel(b))}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          b.isWalkIn
                            ? 'bg-neutral-muted text-neutral-foreground'
                            : 'bg-brand-blue/10 text-brand-blue'
                        }`}
                      >
                        {b.isWalkIn ? 'Walk-in' : 'App'}
                      </span>
                      <p className="mt-1 text-xs font-semibold text-muted">
                        Est {formatClock(b.scheduledAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-foreground">My schedule today</h2>
                  <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-blue">
                    {myToday.length} appointments
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{scheduleWindow}</p>
              </div>
              <Link
                href="/dashboard/my-day/schedule"
                className="text-sm font-semibold text-brand-blue hover:underline"
              >
                Full schedule →
              </Link>
            </div>
            {myToday.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted">No appointments on your calendar today.</p>
            ) : (
              <ol className="relative mt-5 space-y-0 border-l border-border pl-5">
                {myToday.slice(0, 8).map((b) => {
                  const isNow = b.queueStatus === 'in_consultation';
                  const finalized =
                    b.status === 'completed' || b.queueStatus === 'ready_checkout';
                  const waiting =
                    b.queueStatus === 'waiting' || b.queueStatus === 'expected';
                  const recordPending = isNow || (finalized && !b.notes);

                  return (
                    <li key={b.id} className="relative pb-5 last:pb-0">
                      <span
                        className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-card ${
                          isNow
                            ? 'bg-brand-blue'
                            : finalized
                              ? 'bg-success'
                              : 'border-2 border-border bg-card'
                        }`}
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-muted">{formatClock(b.scheduledAt)}</p>
                          <p className="mt-0.5 truncate font-semibold text-foreground">
                            {b.petName} · {titleCase(serviceLabel(b))}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                          {isNow ? (
                            <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[10px] font-bold uppercase text-on-contrast">
                              Now
                            </span>
                          ) : null}
                          {finalized && !recordPending ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                              Finalized <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : null}
                          {recordPending ? (
                            <span className="rounded-full bg-danger-muted px-2 py-0.5 text-[10px] font-bold text-danger-foreground">
                              Record pending
                            </span>
                          ) : null}
                          {waiting && !isNow ? (
                            <span className="rounded-full bg-neutral-muted px-2 py-0.5 text-[10px] font-bold text-neutral-foreground">
                              Waiting
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
