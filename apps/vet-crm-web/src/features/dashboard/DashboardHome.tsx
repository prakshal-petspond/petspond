'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ConsultationBooking } from '@petspond/types';
import { Bell, Plus, TriangleAlert } from 'lucide-react';
import { frontDeskApi } from '@/services/front-desk.service';
import { useFrontDeskData } from '@/features/front-desk/shared/useFrontDeskData';
import {
  formatMoney,
  formatTime,
  ownerLabel,
  waitMinutesSince,
} from '@/features/front-desk/shared/utils';
import { formatDashboardDate, isToday, useDashboard } from './DashboardContext';

type ApptTab = 'today' | 'upcoming' | 'past';

function isEmergencyBooking(b: ConsultationBooking): boolean {
  const blob = [...(b.reasonIds ?? []), b.notes ?? '', b.roomLabel ?? ''].join(' ').toLowerCase();
  return blob.includes('emergency');
}

function appointmentStatus(b: ConsultationBooking): { label: string; className: string } {
  if (
    b.paymentStatus === 'pending' &&
    (b.queueStatus === 'ready_checkout' || b.status === 'completed')
  ) {
    return { label: 'Billing due', className: 'bg-danger-muted text-danger-foreground' };
  }
  switch (b.queueStatus) {
    case 'waiting':
      return { label: 'Checked In', className: 'bg-success-muted text-success-foreground' };
    case 'in_consultation':
      if (b.roomLabel?.toLowerCase().includes('diagnostic')) {
        return { label: 'Diagnostics', className: 'bg-caution-muted text-caution-foreground' };
      }
      return { label: 'With doctor', className: 'bg-info-muted text-info-foreground' };
    case 'ready_checkout':
      return { label: 'Billing due', className: 'bg-danger-muted text-danger-foreground' };
    case 'expected':
    default:
      if (b.status === 'completed')
        return { label: 'Completed', className: 'bg-neutral-muted text-neutral-foreground' };
      if (b.status === 'no_show')
        return { label: 'No-show', className: 'bg-neutral-muted text-neutral-foreground' };
      if (b.status === 'cancelled')
        return { label: 'Cancelled', className: 'bg-neutral-muted text-neutral-foreground' };
      return { label: 'Confirmed', className: 'bg-info-muted text-info-foreground' };
  }
}

function formatOverviewSubtitle(d = new Date()) {
  return `${d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · The day at a glance`;
}

function formatIncomingWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const time = formatTime(iso);
  if (sameDay(d, tomorrow)) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString(undefined, { weekday: 'short' })} · ${time}`;
}

export function DashboardHome() {
  const { clinic, consultations, loading: ctxLoading } = useDashboard();
  const [apptTab, setApptTab] = useState<ApptTab>('today');

  const { data: checkIn, loading: checkInLoading } = useFrontDeskData(
    useCallback((c) => frontDeskApi.getCheckIn(c), [])
  );
  const { data: queue } = useFrontDeskData(useCallback((c) => frontDeskApi.getQueue(c), []));
  const { data: payments } = useFrontDeskData(
    useCallback((c) => frontDeskApi.getPayments(c, 'all'), [])
  );

  const loading = ctxLoading || checkInLoading;

  const todayBookings = useMemo(() => {
    const fromCheckIn = [
      ...(checkIn?.expectedArrivals ?? []),
      ...(checkIn?.recentlyCheckedIn ?? []),
    ];
    const fromQueue = [
      ...(queue?.waiting ?? []),
      ...(queue?.inConsultation ?? []),
      ...(queue?.readyCheckout ?? []),
    ];
    const map = new Map<string, ConsultationBooking>();
    for (const b of [
      ...fromCheckIn,
      ...fromQueue,
      ...consultations.filter((c) => isToday(c.scheduledAt)),
    ]) {
      map.set(b.id, b);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [checkIn, queue, consultations]);

  const upcomingBookings = useMemo(
    () =>
      consultations
        .filter((c) => new Date(c.scheduledAt).getTime() > Date.now() && !isToday(c.scheduledAt))
        .filter((c) => c.status !== 'cancelled')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [consultations]
  );

  const pastBookings = useMemo(
    () =>
      consultations
        .filter((c) => new Date(c.scheduledAt).getTime() < Date.now() && !isToday(c.scheduledAt))
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
        .slice(0, 20),
    [consultations]
  );

  const tableRows =
    apptTab === 'today' ? todayBookings : apptTab === 'upcoming' ? upcomingBookings : pastBookings;

  const incomingRequests = useMemo(
    () =>
      consultations
        .filter((c) => !c.isWalkIn)
        .filter((c) => c.status === 'scheduled' || c.status === 'pending_payment')
        .filter((c) => new Date(c.scheduledAt).getTime() > Date.now())
        .filter((c) => !isToday(c.scheduledAt))
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 5),
    [consultations]
  );

  const emergencies = todayBookings.filter(isEmergencyBooking);
  const emergenciesInConsult = emergencies.filter((b) => b.queueStatus === 'in_consultation');
  const appBookedToday = todayBookings.filter((b) => !b.isWalkIn).length;
  const readyCheckout = queue?.readyCheckout ?? [];
  const waiting = queue?.waiting ?? [];
  const inConsultation = queue?.inConsultation ?? [];
  const arriving = checkIn?.expectedArrivals ?? [];

  const maxWait = waiting.reduce((max, b) => Math.max(max, waitMinutesSince(b.checkedInAt)), 0);
  const delayed = (queue?.stats.avgWaitMinutes ?? 0) >= 15;

  if (loading || !checkIn) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading overview…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Clinic Overview</h1>
            <p className="mt-1 text-sm text-muted">{formatOverviewSubtitle()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted hover:bg-background-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-emergency px-4 py-2.5 text-sm font-semibold text-on-contrast hover:bg-emergency-hover"
            >
              <TriangleAlert className="h-4 w-4" />
              Emergency
            </button>
            <Link
              href="/dashboard/legacy?tab=bookings"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-on-contrast hover:bg-brand-blue-hover"
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </Link>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-brand-blue p-5 text-on-contrast shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-on-contrast/80">
                Today&apos;s Appointments
              </p>
              <span className="rounded-lg bg-on-contrast/15 p-2 text-sm" aria-hidden>
                📅
              </span>
            </div>
            <p className="mt-3 text-4xl font-bold">{checkIn.summary.bookedToday}</p>
            <p className="mt-2 text-sm text-on-contrast/85">{appBookedToday} via app</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                In Queue Now
              </p>
              <span className="rounded-lg bg-brand-blue/10 p-2 text-brand-blue" aria-hidden>
                ≡
              </span>
            </div>
            <p className="mt-3 text-4xl font-bold text-foreground">
              {queue?.stats.petsInClinic ?? 0}
            </p>
            <p className="mt-2 text-sm text-muted">
              {queue?.stats.avgWaitMinutes
                ? `~${queue.stats.avgWaitMinutes} min avg wait`
                : 'No wait yet'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Ready for Checkout
              </p>
              <span className="rounded-lg bg-success-muted p-2 text-success" aria-hidden>
                ✓
              </span>
            </div>
            <p className="mt-3 text-4xl font-bold text-foreground">{readyCheckout.length}</p>
            <p className="mt-2 text-sm text-muted">
              {payments
                ? `${formatMoney(payments.summary.pendingPaise)} to collect`
                : '₹0 to collect'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Emergencies Today
              </p>
              <span className="rounded-lg bg-danger-muted p-2 text-danger" aria-hidden>
                <TriangleAlert className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-4xl font-bold text-foreground">{emergencies.length}</p>
            <p className="mt-2 text-sm text-muted">
              {emergenciesInConsult.length} in consultation now
            </p>
          </div>
        </div>

        {/* Front Desk at a glance */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">Front Desk at a glance</h2>
              {delayed ? (
                <span className="rounded-full bg-danger px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-on-contrast">
                  Delayed ~{Math.max(queue?.stats.avgWaitMinutes ?? 0, maxWait)} min
                </span>
              ) : null}
            </div>
            <Link
              href="/dashboard/check-in"
              className="text-sm font-semibold text-brand-blue hover:underline"
            >
              Open Front Desk →
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <GlanceColumn
              title="Arriving"
              count={arriving.length}
              empty="No arrivals waiting"
              items={arriving.slice(0, 3).map((b, i) => ({
                id: b.id,
                primary:
                  i === 0
                    ? `Next: ${b.petName} · ${formatTime(b.scheduledAt)}`
                    : `${b.petName} · ${formatTime(b.scheduledAt)}`,
              }))}
            />
            <GlanceColumn
              title="Waiting"
              count={waiting.length}
              empty="Queue is clear"
              items={[
                ...emergencies
                  .filter((b) => b.queueStatus === 'waiting')
                  .slice(0, 1)
                  .map((b) => ({
                    id: `em-${b.id}`,
                    primary: 'Emergency intake (pinned)',
                    tone: 'danger' as const,
                  })),
                ...waiting.slice(0, 3).map((b) => ({
                  id: b.id,
                  primary: `${b.petName} · waiting ${waitMinutesSince(b.checkedInAt)} min`,
                })),
              ].slice(0, 3)}
            />
            <GlanceColumn
              title="In Consultation"
              count={inConsultation.length}
              empty="No active consults"
              items={inConsultation.slice(0, 3).map((b) => ({
                id: b.id,
                primary: `${b.petName} · ${b.vetName ?? 'Doctor'}`,
              }))}
            />
            <GlanceColumn
              title="Ready for Checkout"
              count={readyCheckout.length}
              empty="Nothing to bill"
              items={readyCheckout.slice(0, 2).flatMap((b) => [
                {
                  id: b.id,
                  primary: `${b.petName} · ${formatMoney(b.totalPaise)}`,
                },
                {
                  id: `${b.id}-note`,
                  primary: b.paymentStatus === 'pending' ? 'Payment pending' : 'Owner notified',
                  muted: true,
                },
              ])}
            />
          </div>
        </section>

        {/* Appointments + Incoming */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold text-foreground">Appointments</h2>
              <div className="flex rounded-full bg-background p-1 text-xs font-semibold">
                {(
                  [
                    ['today', 'Today'],
                    ['upcoming', 'Upcoming'],
                    ['past', 'Past'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setApptTab(key)}
                    className={`rounded-full px-3.5 py-1.5 transition ${
                      apptTab === key
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tableRows.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted">
                No appointments in this view.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-muted">
                      <th className="px-5 py-3">Time</th>
                      <th className="px-5 py-3">Pet &amp; Owner</th>
                      <th className="px-5 py-3">Vet</th>
                      <th className="px-5 py-3">Source</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.slice(0, 8).map((row) => {
                      const status = appointmentStatus(row);
                      return (
                        <tr key={row.id} className="border-b border-border/60 last:border-0">
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            {formatTime(row.scheduledAt)}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-foreground">
                              {row.petName}
                              {row.petBreed ? (
                                <span className="font-normal text-muted"> · {row.petBreed}</span>
                              ) : null}
                            </p>
                            <p className="text-xs text-muted">{ownerLabel(row)}</p>
                          </td>
                          <td className="px-5 py-3.5 text-foreground">{row.vetName ?? '—'}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                row.isWalkIn
                                  ? 'bg-neutral-muted text-neutral-foreground'
                                  : 'bg-brand-blue/10 text-brand-blue'
                              }`}
                            >
                              {row.isWalkIn ? 'Walk-in' : 'App'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-foreground">Incoming Requests</h2>
              {incomingRequests.length > 0 ? (
                <span className="rounded-full bg-caution-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-caution-foreground">
                  {incomingRequests.length} new
                </span>
              ) : null}
            </div>
            <p className="mb-4 text-xs text-muted">App bookings awaiting confirmation</p>

            {incomingRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No pending app requests.</p>
            ) : (
              <ul className="space-y-3">
                {incomingRequests.map((req) => (
                  <li key={req.id} className="rounded-xl border border-border p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {req.petName}
                          {req.petBreed ? (
                            <span className="font-normal text-muted"> · {req.petBreed}</span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">{ownerLabel(req)}</p>
                        <p className="mt-1 text-xs text-muted">
                          {formatIncomingWhen(req.scheduledAt)}
                        </p>
                        <p className="text-xs capitalize text-muted">
                          {req.reasonIds[0]?.replace(/-/g, ' ') ?? 'Consultation'}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-blue">
                        App
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-lg bg-brand-blue py-2 text-xs font-semibold text-on-contrast hover:bg-brand-blue-hover"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-lg border border-border bg-background py-2 text-xs font-semibold text-muted hover:text-foreground"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/dashboard/legacy?tab=bookings"
              className="mt-4 block text-center text-sm font-semibold text-brand-blue hover:underline"
            >
              View all requests
            </Link>
          </section>
        </div>

        {clinic ? (
          <p className="text-center text-xs text-muted">
            {clinic.name} · {formatDashboardDate()}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function GlanceColumn({
  title,
  count,
  empty,
  items,
}: {
  title: string;
  count: number;
  empty: string;
  items: { id: string; primary: string; tone?: 'danger'; muted?: boolean }[];
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted">
        {title} <span className="text-foreground">({count})</span>
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`text-sm ${
                item.tone === 'danger'
                  ? 'font-semibold text-danger'
                  : item.muted
                    ? 'text-xs text-muted'
                    : 'text-foreground'
              }`}
            >
              {item.primary}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
