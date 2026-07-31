'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Plus, Search, TriangleAlert } from 'lucide-react';
import type { ConsultationBooking } from '@petspond/types';
import { useApi } from '@/contexts';
import { frontDeskApi } from '@/services/front-desk.service';
import { useFrontDeskData } from './shared/useFrontDeskData';
import {
  formatMoney,
  formatTime,
  ownerLabel,
  serviceLabel,
  waitMinutesSince,
} from './shared/utils';
import { WalkInModal } from './check-in/WalkInModal';

type BoardFilter = 'all' | 'waiting' | 'ready';
type ArrivingWindow = 'next2h' | 'all';

function isEmergency(b: ConsultationBooking): boolean {
  const blob = [...(b.reasonIds ?? []), b.notes ?? '', b.roomLabel ?? '', b.petName ?? '']
    .join(' ')
    .toLowerCase();
  return blob.includes('emergency');
}

function estimatedReadyLabel(checkedInAt?: string, avgWait = 20): string {
  const start = checkedInAt ? new Date(checkedInAt).getTime() : Date.now();
  const est = new Date(start + avgWait * 60_000);
  return est.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

function matchesQuery(b: ConsultationBooking, q: string): boolean {
  if (!q) return true;
  const hay = [
    b.petName,
    b.petBreed,
    b.userName,
    b.ownerNameSnapshot,
    b.userMobile,
    b.ownerMobileSnapshot,
    b.vetName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export function FrontDeskPage() {
  const { client } = useApi();
  const [boardFilter, setBoardFilter] = useState<BoardFilter>('all');
  const [arrivingWindow, setArrivingWindow] = useState<ArrivingWindow>('next2h');
  const [query, setQuery] = useState('');
  const [columnQuery, setColumnQuery] = useState('');
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const {
    data: checkIn,
    loading: checkInLoading,
    error: checkInError,
    refresh: refreshCheckIn,
  } = useFrontDeskData(useCallback((c) => frontDeskApi.getCheckIn(c), []));

  const {
    data: queue,
    loading: queueLoading,
    error: queueError,
    refresh: refreshQueue,
  } = useFrontDeskData(useCallback((c) => frontDeskApi.getQueue(c), []));

  const refresh = useCallback(async () => {
    await Promise.all([refreshCheckIn(), refreshQueue()]);
  }, [refreshCheckIn, refreshQueue]);

  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const loading = checkInLoading || queueLoading;
  const error = checkInError || queueError || actionError;

  const arrivals = useMemo(() => {
    const list = checkIn?.expectedArrivals ?? [];
    const now = Date.now();
    const twoHours = now + 2 * 60 * 60 * 1000;
    return list
      .filter((b) => matchesQuery(b, columnQuery) && matchesQuery(b, query))
      .filter((b) => {
        if (arrivingWindow === 'all') return true;
        const t = new Date(b.scheduledAt).getTime();
        return t >= now - 30 * 60_000 && t <= twoHours;
      });
  }, [checkIn, arrivingWindow, columnQuery, query]);

  const laterTodayCount = useMemo(() => {
    if (!checkIn) return 0;
    const shown = new Set(arrivals.map((a) => a.id));
    return checkIn.expectedArrivals.filter((b) => !shown.has(b.id)).length;
  }, [checkIn, arrivals]);

  const waiting = useMemo(() => {
    const list = [...(queue?.waiting ?? [])].sort((a, b) => {
      const aEm = isEmergency(a) ? 0 : 1;
      const bEm = isEmergency(b) ? 0 : 1;
      if (aEm !== bEm) return aEm - bEm;
      return waitMinutesSince(b.checkedInAt) - waitMinutesSince(a.checkedInAt);
    });
    return list.filter((b) => matchesQuery(b, query));
  }, [queue, query]);

  const inConsultation = useMemo(
    () => (queue?.inConsultation ?? []).filter((b) => matchesQuery(b, query)),
    [queue, query],
  );

  const readyCheckout = useMemo(
    () => (queue?.readyCheckout ?? []).filter((b) => matchesQuery(b, query)),
    [queue, query],
  );

  const showWaiting = boardFilter === 'all' || boardFilter === 'waiting';
  const showReady = boardFilter === 'all' || boardFilter === 'ready';
  const showArriving = boardFilter === 'all';
  const showInConsult = boardFilter === 'all';

  const avgWait = queue?.stats.avgWaitMinutes ?? 0;
  const delayed = avgWait >= 15;
  const delayedCount = waiting.filter((b) => waitMinutesSince(b.checkedInAt) >= 15).length;
  const emergencyInProgress =
    waiting.some(isEmergency) || inConsultation.some(isEmergency);

  const handleCheckIn = async (id: string) => {
    setActionError('');
    setBusyId(id);
    try {
      await frontDeskApi.checkIn(client, id);
      await refresh();
    } catch (err: unknown) {
      setActionError((err as { message?: string })?.message ?? 'Check-in failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleStartConsult = async (id: string) => {
    setActionError('');
    setBusyId(id);
    try {
      await frontDeskApi.updateQueue(client, id, {
        queueStatus: 'in_consultation',
        roomLabel: `Room ${((inConsultation.length % 3) + 1)}`,
      });
      await refresh();
    } catch (err: unknown) {
      setActionError((err as { message?: string })?.message ?? 'Could not start consultation');
    } finally {
      setBusyId(null);
    }
  };

  const handleCollect = async (id: string, amountPaise: number) => {
    setActionError('');
    setBusyId(id);
    try {
      await frontDeskApi.collectPayment(client, id, { paymentMethodLabel: 'Cash / UPI' });
      await refresh();
    } catch (err: unknown) {
      setActionError(
        (err as { message?: string })?.message ?? `Could not collect ${formatMoney(amountPaise)}`,
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleWalkIn = async (data: {
    petName: string;
    petBreed: string;
    ownerName: string;
    ownerMobile: string;
    totalPaise: number;
  }) => {
    await frontDeskApi.createWalkIn(client, {
      petName: data.petName,
      petBreed: data.petBreed,
      ownerName: data.ownerName,
      ownerMobile: data.ownerMobile || undefined,
      totalPaise: data.totalPaise,
      reasonIds: ['walk-in'],
    });
    await refresh();
  };

  if (loading || !checkIn || !queue) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading front desk…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Front Desk</h1>
            <p className="mt-1 text-sm text-muted">Arrivals and live queue — one pipeline, one glance</p>
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
            <button
              type="button"
              onClick={() => setWalkInOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-on-contrast hover:bg-brand-blue-hover"
            >
              <Plus className="h-4 w-4" />
              Walk-in
            </button>
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex flex-wrap gap-2">
          <StatPill label={`${checkIn.summary.bookedToday} expected today`} />
          <StatPill label={`${checkIn.summary.arrived} checked in`} />
          <StatPill label={`${queue.stats.petsInClinic} in queue`} />
          <StatPill label={avgWait > 0 ? `~${avgWait} min avg wait` : 'No wait yet'} />
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the board — pet, owner or phone"
              className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div className="flex rounded-full border border-border bg-card p-1 text-xs font-semibold">
            {(
              [
                ['all', 'All'],
                ['waiting', 'Waiting'],
                ['ready', 'Ready'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setBoardFilter(key)}
                className={`rounded-full px-4 py-2 transition ${
                  boardFilter === key
                    ? 'bg-foreground text-on-contrast'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        {/* Emergency banner */}
        {emergencyInProgress || delayed ? (
          <div className="flex flex-col gap-3 rounded-xl border border-danger-border bg-danger-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-danger-foreground">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {emergencyInProgress
                ? `Emergency in progress${delayed ? ` — queue delayed ~${avgWait} min` : ''}`
                : `Queue delayed ~${avgWait} min`}
            </p>
            {delayedCount > 0 ? (
              <button
                type="button"
                className="shrink-0 rounded-lg bg-danger px-3.5 py-2 text-xs font-semibold text-on-contrast hover:bg-danger-hover"
              >
                Notify delayed ({delayedCount})
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Kanban */}
        <div
          className={`grid gap-4 ${
            boardFilter === 'all'
              ? 'xl:grid-cols-4'
              : boardFilter === 'waiting'
                ? 'md:grid-cols-1 max-w-md'
                : 'md:grid-cols-1 max-w-md'
          }`}
        >
          {showArriving ? (
            <div className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-surface-board p-4">
              <ColumnHeader title="Arriving" count={arrivals.length} />

              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                  <input
                    value={columnQuery}
                    onChange={(e) => setColumnQuery(e.target.value)}
                    placeholder="Phone / pet / code…"
                    className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-brand-blue"
                  />
                </div>
                <div className="flex rounded-lg bg-background p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setArrivingWindow('next2h')}
                    className={`flex-1 rounded-md py-1.5 ${
                      arrivingWindow === 'next2h' ? 'bg-card text-foreground shadow-sm' : 'text-muted'
                    }`}
                  >
                    Next 2 hrs
                  </button>
                  <button
                    type="button"
                    onClick={() => setArrivingWindow('all')}
                    className={`flex-1 rounded-md py-1.5 ${
                      arrivingWindow === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted'
                    }`}
                  >
                    All day
                  </button>
                </div>
              </div>

              <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
                {arrivals.length === 0 ? (
                  <li className="py-8 text-center text-sm text-muted">No arrivals in this window.</li>
                ) : (
                  arrivals.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-muted">{formatTime(b.scheduledAt)}</p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {b.petName}
                          {b.petBreed ? (
                            <span className="font-normal text-muted"> · {b.petBreed}</span>
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-muted">{ownerLabel(b)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => void handleCheckIn(b.id)}
                        className="shrink-0 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-on-contrast hover:bg-success-hover disabled:opacity-50"
                      >
                        {busyId === b.id ? '…' : 'Check In'}
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={() => setWalkInOpen(true)}
                  className="w-full rounded-xl border border-dashed border-border bg-card/60 py-2.5 text-sm font-medium text-muted hover:border-brand-blue hover:text-brand-blue"
                >
                  + Walk-in (phone lookup)
                </button>
                {laterTodayCount > 0 && arrivingWindow === 'next2h' ? (
                  <button
                    type="button"
                    onClick={() => setArrivingWindow('all')}
                    className="w-full text-center text-sm font-semibold text-brand-blue hover:underline"
                  >
                    +{laterTodayCount} later today →
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {showWaiting ? (
            <KanbanColumn title="Waiting" count={waiting.length} footer="Drag to reorder — emergencies stay pinned">
              {waiting.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Queue is clear.</p>
              ) : (
                waiting.map((b) =>
                  isEmergency(b) ? (
                    <EmergencyCard key={b.id} booking={b} />
                  ) : (
                    <WaitingCard
                      key={b.id}
                      booking={b}
                      avgWait={avgWait || 20}
                      busy={busyId === b.id}
                      onStart={() => void handleStartConsult(b.id)}
                    />
                  ),
                )
              )}
            </KanbanColumn>
          ) : null}

          {showInConsult ? (
            <KanbanColumn
              title="In Consultation"
              count={inConsultation.length}
              footer="Cards advance when the vet finalizes the record"
            >
              {inConsultation.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">No active consults.</p>
              ) : (
                inConsultation.map((b) => <InConsultCard key={b.id} booking={b} />)
              )}
            </KanbanColumn>
          ) : null}

          {showReady ? (
            <KanbanColumn
              title="Ready for Checkout"
              count={readyCheckout.length}
              footer="Owner notified; ready for checkout"
            >
              {readyCheckout.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Nothing to bill.</p>
              ) : (
                readyCheckout.map((b) => (
                  <CheckoutCard
                    key={b.id}
                    booking={b}
                    busy={busyId === b.id}
                    onCollect={() => void handleCollect(b.id, b.totalPaise)}
                  />
                ))
              )}
            </KanbanColumn>
          ) : null}
        </div>
      </div>

      <WalkInModal open={walkInOpen} onClose={() => setWalkInOpen(false)} onSubmit={handleWalkIn} />
    </div>
  );
}

function StatPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted">
      {label}
    </span>
  );
}

function ColumnHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{title}</h2>
      <span className="rounded-full bg-background px-2 py-0.5 text-xs font-bold text-foreground">
        {count}
      </span>
    </div>
  );
}

function KanbanColumn({
  title,
  count,
  footer,
  children,
}: {
  title: string;
  count: number;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-surface-board p-4">
      <ColumnHeader title={title} count={count} />
      <div className="mt-3 flex-1 space-y-3 overflow-y-auto">{children}</div>
      {footer ? <p className="mt-3 border-t border-border/60 pt-3 text-[11px] text-muted">{footer}</p> : null}
    </div>
  );
}

function SourceBadge({ walkIn }: { walkIn?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        walkIn ? 'bg-neutral-muted text-neutral-foreground' : 'bg-brand-blue/10 text-brand-blue'
      }`}
    >
      {walkIn ? 'Walk-in' : 'App'}
    </span>
  );
}

function EmergencyCard({ booking }: { booking: ConsultationBooking }) {
  return (
    <article className="rounded-xl border-2 border-danger bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full bg-danger px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-contrast">
          Emergency
        </span>
      </div>
      <p className="font-bold text-foreground">Emergency intake</p>
      <p className="mt-1 text-xs text-muted">
        {booking.petName ? `${booking.petName} · ` : ''}
        Details pending · vet alerted
      </p>
      <button
        type="button"
        className="mt-3 w-full rounded-lg border border-danger-border bg-danger-muted py-2 text-xs font-semibold text-danger-foreground hover:bg-danger-muted"
      >
        Add details — unlock
      </button>
    </article>
  );
}

function WaitingCard({
  booking,
  avgWait,
  busy,
  onStart,
}: {
  booking: ConsultationBooking;
  avgWait: number;
  busy?: boolean;
  onStart: () => void;
}) {
  const wait = waitMinutesSince(booking.checkedInAt);
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {booking.petName}
            {booking.petBreed ? (
              <span className="font-normal text-muted"> · {booking.petBreed}</span>
            ) : null}
          </p>
          <p className="text-xs text-muted">{ownerLabel(booking)}</p>
        </div>
        <SourceBadge walkIn={booking.isWalkIn} />
      </div>
      <p className="mt-2 text-xs capitalize text-muted">{serviceLabel(booking)}</p>
      <p className="mt-1 text-xs text-muted">
        Waiting {wait} min · Est {estimatedReadyLabel(booking.checkedInAt, avgWait)}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onStart}
        className="mt-3 w-full rounded-xl bg-brand-blue py-2.5 text-xs font-semibold text-on-contrast hover:bg-brand-blue-hover disabled:opacity-50"
      >
        {busy ? 'Starting…' : 'Start consultation'}
      </button>
    </article>
  );
}

function InConsultCard({ booking }: { booking: ConsultationBooking }) {
  const mins = waitMinutesSince(booking.consultationStartedAt);
  const diagnostics = booking.roomLabel?.toLowerCase().includes('diagnostic');
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {booking.petName}
            {booking.petBreed ? (
              <span className="font-normal text-muted"> · {booking.petBreed}</span>
            ) : null}
          </p>
          <p className="text-xs text-muted">{ownerLabel(booking)}</p>
        </div>
        <SourceBadge walkIn={booking.isWalkIn} />
      </div>
      <p className="mt-2 text-xs capitalize text-muted">{serviceLabel(booking)}</p>
      {diagnostics ? (
        <span className="mt-2 inline-flex rounded-full bg-caution-muted px-2 py-0.5 text-[10px] font-bold uppercase text-caution-foreground">
          Diagnostics
        </span>
      ) : null}
      <p className="mt-2 text-xs text-muted">
        {diagnostics
          ? booking.roomLabel || 'Diagnostics in progress'
          : `With ${booking.vetName ?? 'doctor'} · In for ${mins} min`}
      </p>
      <div className="mt-3 rounded-lg bg-background px-3 py-2 text-xs text-muted">
        Awaiting record finalize…
      </div>
    </article>
  );
}

function CheckoutCard({
  booking,
  busy,
  onCollect,
}: {
  booking: ConsultationBooking;
  busy?: boolean;
  onCollect: () => void;
}) {
  const paid = booking.paymentStatus === 'paid';
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {booking.petName}
            {booking.petBreed ? (
              <span className="font-normal text-muted"> · {booking.petBreed}</span>
            ) : null}
          </p>
          <p className="text-xs text-muted">{ownerLabel(booking)}</p>
        </div>
        <SourceBadge walkIn={booking.isWalkIn} />
      </div>
      <p className="mt-3 text-lg font-bold text-foreground">{formatMoney(booking.totalPaise)}</p>
      <p className="mt-1 text-xs font-medium text-success">Record finalized ✓</p>
      {!paid ? (
        <button
          type="button"
          disabled={busy}
          onClick={onCollect}
          className="mt-3 w-full rounded-xl bg-success py-2.5 text-xs font-semibold text-on-contrast hover:bg-success-hover disabled:opacity-50"
        >
          {busy ? 'Collecting…' : `Collect ${formatMoney(booking.totalPaise)}`}
        </button>
      ) : (
        <p className="mt-3 text-center text-xs font-semibold text-success-foreground">Paid</p>
      )}
    </article>
  );
}
