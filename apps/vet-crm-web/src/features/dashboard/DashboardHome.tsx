'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { frontDeskApi } from '@/services/front-desk.service';
import { PageHeader } from '@/features/front-desk/shared/PageHeader';
import { useFrontDeskData } from '@/features/front-desk/shared/useFrontDeskData';
import {
  avatarColorFor,
  formatMoney,
  formatTime,
  ownerLabel,
  petInitials,
  scheduledRelativeHint,
} from '@/features/front-desk/shared/utils';
import { formatDashboardDate, useDashboard } from './DashboardContext';

export function DashboardHome() {
  const { clinic, loading: ctxLoading } = useDashboard();

  const { data: checkIn, loading: checkInLoading } = useFrontDeskData(
    useCallback((c) => frontDeskApi.getCheckIn(c), []),
  );
  const { data: queue } = useFrontDeskData(useCallback((c) => frontDeskApi.getQueue(c), []));
  const { data: payments } = useFrontDeskData(
    useCallback((c) => frontDeskApi.getPayments(c, 'all'), []),
  );

  const loading = ctxLoading || checkInLoading;

  if (loading || !checkIn) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading dashboard…</p>
      </div>
    );
  }

  const queuePreview = checkIn.expectedArrivals.slice(0, 6);
  const activeConsultations = queue?.inConsultation ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1440px]">
        <PageHeader
          title="Front Office Dashboard"
          subtitle={`${formatDashboardDate()} · Reception Desk`}
          actions={
            <>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground"
              >
                <span aria-hidden>📅</span> Today <span className="text-muted">▾</span>
              </button>
              <Link
                href="/dashboard/check-in"
                className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-hover"
              >
                + New Check-in
              </Link>
            </>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[200px_minmax(0,1fr)_280px]">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
            <div className="rounded-2xl bg-brand-blue p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Arrivals Today</p>
              <p className="mt-3 text-4xl font-bold">{checkIn.summary.bookedToday}</p>
              <span className="mt-3 inline-block rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                {checkIn.summary.waitingToCheckIn} in waiting
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Checked In</p>
              <p className="mt-3 text-4xl font-bold text-foreground">{checkIn.summary.arrived}</p>
              <p className="mt-1 text-xs text-muted">{queue?.inConsultation.length ?? 0} in consultation</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Payments Due</p>
              <p className="mt-3 text-3xl font-bold text-foreground">
                {payments ? formatMoney(payments.summary.pendingPaise) : '₹0'}
              </p>
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {payments?.summary.pendingCount ?? 0} pending
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">No-Shows</p>
              <p className="mt-3 text-4xl font-bold text-foreground">{checkIn.summary.noShow}</p>
              <p className="mt-1 text-xs text-muted">From {checkIn.summary.bookedToday} scheduled</p>
            </div>
          </div>

          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-bold text-foreground">Check-in Queue</h2>
                <p className="text-xs text-muted">
                  {checkIn.summary.waitingToCheckIn} pets waiting for check-in
                </p>
              </div>
              <Link href="/dashboard/check-in" className="text-sm font-semibold text-brand-blue hover:underline">
                View all
              </Link>
            </div>
            {queuePreview.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">No expected arrivals today.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-muted">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Pet &amp; Owner</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queuePreview.map((row) => {
                    const hint = scheduledRelativeHint(row.scheduledAt);
                    return (
                      <tr key={row.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-4">
                          <p className="font-semibold">{formatTime(row.scheduledAt)}</p>
                          <p className="text-xs text-muted">{hint.label}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${avatarColorFor(row.id)}`}
                            >
                              {petInitials(row.petName)}
                            </span>
                            <div>
                              <p className="font-semibold text-foreground">{row.petName}</p>
                              <p className="text-xs text-muted">
                                {row.petBreed} · {ownerLabel(row)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href="/dashboard/check-in"
                            className="inline-flex rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-brand-blue-hover"
                          >
                            Check-in
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-foreground">Active Consultations</h2>
              {activeConsultations.length === 0 ? (
                <p className="text-sm text-muted">No active consultations.</p>
              ) : (
                <ul className="space-y-3">
                  {activeConsultations.map((c) => (
                    <li key={c.id} className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" />
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{c.vetName ?? 'Doctor'}</span>
                        <span className="text-muted"> · {c.petName}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-foreground">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/dashboard/legacy?tab=bookings"
                  className="flex w-full justify-center rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white hover:bg-brand-blue-hover"
                >
                  + New Appointment
                </Link>
                <Link
                  href="/dashboard/pets"
                  className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-background-muted"
                >
                  Add Pet/Owner
                </Link>
                <Link
                  href="/dashboard/payments"
                  className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-background-muted"
                >
                  Collect payment
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-foreground">Pending Payments</h2>
                <span className="rounded-full bg-error/10 px-2.5 py-1 text-xs font-bold text-error">
                  {payments?.summary.pendingCount ?? 0} due
                </span>
              </div>
              {!payments?.invoices.filter((i) => i.paymentStatus === 'pending').length ? (
                <p className="text-sm text-muted">No pending payments today.</p>
              ) : (
                <ul className="space-y-3">
                  {payments.invoices
                    .filter((i) => i.paymentStatus === 'pending')
                    .slice(0, 3)
                    .map((p) => (
                      <li key={p.id} className="flex justify-between gap-2 text-sm">
                        <div>
                          <p className="font-semibold text-foreground">{p.petName}</p>
                          <p className="text-xs capitalize text-muted">{p.reasonIds[0] ?? 'Visit'}</p>
                        </div>
                        <span className="font-bold">{formatMoney(p.totalPaise)}</span>
                      </li>
                    ))}
                </ul>
              )}
              <Link
                href="/dashboard/payments"
                className="mt-4 flex w-full justify-center rounded-xl bg-onboarding-accent py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                View All Payments
              </Link>
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
