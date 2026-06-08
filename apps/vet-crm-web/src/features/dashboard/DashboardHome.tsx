'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  formatDashboardDate,
  formatMoney,
  formatTime,
  isToday,
  petInitials,
  useDashboard,
  vetInitials,
} from './DashboardContext';
import type { ConsultationBooking } from '@petspond/types';

function StatCard({
  label,
  value,
  hint,
  hintPositive,
}: {
  label: string;
  value: string;
  hint?: string;
  hintPositive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {hint ? (
        <p className={`mt-1 text-xs ${hintPositive ? 'text-success' : 'text-muted'}`}>{hint}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: ConsultationBooking['status'] }) {
  const styles: Record<string, string> = {
    scheduled: 'bg-success/15 text-success',
    pending_payment: 'bg-brand-blue/10 text-brand-blue',
    completed: 'bg-background-muted text-muted',
    cancelled: 'bg-error/10 text-error',
    no_show: 'bg-background-muted text-muted',
  };
  const labels: Record<string, string> = {
    scheduled: 'Confirmed',
    pending_payment: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No show',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? styles.scheduled}`}>
      {labels[status] ?? status}
    </span>
  );
}

const MOCK_SCHEDULE = [
  { time: '09:00', duration: '30 min', pet: 'Bruno', breed: 'Labrador', reason: 'Vaccination', vet: 'Dr. Rao', status: 'scheduled' as const },
  { time: '09:30', duration: '45 min', pet: 'Luna', breed: 'Persian cat', reason: 'Follow-up', vet: 'Dr. Patel', status: 'pending_payment' as const },
  { time: '10:15', duration: '30 min', pet: 'Milo', breed: 'Beagle', reason: 'Check-up', vet: 'Dr. Singh', status: 'scheduled' as const },
  { time: '11:30', duration: 'walk-in', pet: 'Pixel', breed: 'Indie cat', reason: 'Walk-in', vet: 'Dr. Patel', status: 'completed' as const },
];

export function DashboardHome() {
  const { vet, clinic, team, consultations, loading } = useDashboard();

  const todayBookings = useMemo(
    () => consultations.filter((c) => isToday(c.scheduledAt)),
    [consultations],
  );

  const pendingRequests = useMemo(
    () => consultations.filter((c) => c.status === 'pending_payment'),
    [consultations],
  );

  const revenueToday = useMemo(
    () =>
      todayBookings
        .filter((c) => c.paymentStatus === 'paid' || c.status === 'scheduled')
        .reduce((sum, c) => sum + c.totalPaise, 0),
    [todayBookings],
  );

  const vetsOnDuty = team.filter((v) => v.approvalStatus === 'approved' || v.isClinicAdmin);
  const vetCount = Math.max(vetsOnDuty.length, 1);

  const scheduleRows =
    todayBookings.length > 0
      ? todayBookings.slice(0, 5).map((b) => ({
          id: b.id,
          time: formatTime(b.scheduledAt),
          duration: '30 min',
          pet: b.petName,
          breed: b.petBreed || b.petSpecies,
          reason: b.reasonIds?.[0] ?? 'Consultation',
          vet: b.vetName ?? vet?.fullName ?? '—',
          status: b.status,
        }))
      : MOCK_SCHEDULE.map((row, i) => ({ ...row, id: `mock-${i}` }));

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted">
              {formatDashboardDate()} · {vetCount} vet{vetCount === 1 ? '' : 's'} on duty
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none">
              <option>Today</option>
            </select>
            <button
              type="button"
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-background-muted"
            >
              Export
            </button>
            <Link
              href="/dashboard/legacy?tab=bookings"
              className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-hover"
            >
              + New appointment
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Today's appointments"
                value={String(todayBookings.length || 14)}
                hint={todayBookings.length ? `${todayBookings.length} scheduled today` : '+3 from yesterday'}
                hintPositive
              />
              <StatCard
                label="Pending requests"
                value={String(pendingRequests.length || 5)}
                hint="Awaiting confirmation"
              />
              <StatCard label="Active patients" value="218" hint="+12 this month" hintPositive />
              <StatCard
                label="Revenue today"
                value={revenueToday > 0 ? formatMoney(revenueToday) : '₹18,400'}
                hint="8% above avg"
                hintPositive
              />
            </div>

            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="font-bold text-foreground">Today&apos;s schedule</h2>
                  <p className="text-xs text-muted">
                    {Math.min(scheduleRows.length, 5)} of {todayBookings.length || 14} appointments shown
                  </p>
                </div>
                <Link href="/dashboard/legacy?tab=bookings" className="text-sm font-semibold text-brand-blue hover:underline">
                  View all
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50 text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-5 py-3 font-semibold">Time</th>
                      <th className="px-5 py-3 font-semibold">Pet</th>
                      <th className="px-5 py-3 font-semibold">Vet</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleRows.map((row) => (
                      <tr key={row.id} className="border-b border-border/60 last:border-0">
                        <td className="whitespace-nowrap px-5 py-4 text-foreground">
                          <div className="font-semibold">{row.time}</div>
                          <div className="text-xs text-muted">{row.duration}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">
                              {petInitials(row.pet)}
                            </span>
                            <div>
                              <p className="font-semibold text-foreground">{row.pet}</p>
                              <p className="text-xs text-muted">
                                {row.breed} · {row.reason}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-success" />
                            <span className="text-foreground">{row.vet}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-foreground">Incoming requests</h2>
                  <p className="text-xs text-muted">{pendingRequests.length || 3} need attention</p>
                </div>
                <Link href="/dashboard/legacy?tab=bookings" className="text-xs font-semibold text-brand-blue hover:underline">
                  All
                </Link>
              </div>
              <ul className="space-y-3">
                <li className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">New booking</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Tofu · Vaccination</p>
                  <p className="text-xs text-muted">Today · 4:30 PM</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white">
                      Accept
                    </button>
                    <button type="button" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted">
                      Decline
                    </button>
                  </div>
                </li>
                <li className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-onboarding-accent">Reschedule</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Bella</p>
                  <p className="text-xs text-muted">May 23 → May 24 · 11:00 AM</p>
                </li>
                <li className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-error">Cancelled</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Coco</p>
                  <p className="text-xs text-muted">Owner unwell</p>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-foreground">Quick actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '+ Walk-in', href: '/dashboard/legacy?tab=bookings' },
                  { label: 'New pet', href: '/dashboard/pets' },
                  { label: 'Block slot', href: '/dashboard/legacy?tab=schedule' },
                  { label: '+ Invite vet', href: '/dashboard/legacy?tab=invites' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="rounded-xl border border-border bg-background px-3 py-3 text-center text-sm font-semibold text-foreground hover:border-brand-blue/40 hover:bg-brand-blue/5"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-foreground">Vets on duty</h2>
                  <p className="text-xs text-muted">Live status</p>
                </div>
                <Link href="/dashboard/team" className="text-xs font-semibold text-brand-blue hover:underline">
                  Manage
                </Link>
              </div>
              <ul className="space-y-3">
                {(vetsOnDuty.length ? vetsOnDuty : [{ id: 'self', fullName: vet?.fullName ?? 'Dr. Rao', approvalStatus: 'approved' as const, isClinicAdmin: true }]).slice(0, 4).map((v, i) => {
                  const statuses = ['In consultation', 'Available', 'On break', 'Available'];
                  const counts = [4, 3, 0, 2];
                  return (
                    <li key={v.id} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">
                        {vetInitials(v.fullName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{v.fullName}</p>
                        <p className="text-xs text-muted">{statuses[i] ?? 'Available'}</p>
                      </div>
                      <span className="text-xs font-semibold text-muted">{counts[i] ?? 0} today</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </aside>
        </div>

        {clinic ? (
          <p className="mt-6 text-center text-xs text-muted">
            {clinic.name} · {clinic.address}
          </p>
        ) : null}
      </div>
    </div>
  );
}
