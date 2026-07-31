'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Bell, Check, Clock, Plus, RotateCcw, Smartphone, TriangleAlert } from 'lucide-react';
import type { ConsultationBooking } from '@petspond/types';
import { useApi } from '@/contexts';
import { frontDeskApi } from '@/services/front-desk.service';
import { useFrontDeskData } from '../shared/useFrontDeskData';
import { formatMoney, ownerLabel } from '../shared/utils';
import type { InvoiceFilter } from './InvoiceFilters';

function invoiceId(inv: ConsultationBooking): string {
  return inv.invoiceNumber ?? `INV-${inv.id.slice(-4).toUpperCase()}`;
}

function isPaidInApp(inv: ConsultationBooking): boolean {
  if (inv.paymentStatus !== 'paid') return false;
  const method = (inv.paymentMethodLabel ?? '').toLowerCase();
  return Boolean(inv.stripeCheckoutSessionId) || method.includes('app') || method.includes('stripe');
}

function normalizeMethod(label?: string): 'UPI' | 'Cash' | 'Card' | 'Other' {
  const m = (label ?? '').toLowerCase();
  if (m.includes('upi')) return 'UPI';
  if (m.includes('cash')) return 'Cash';
  if (m.includes('card')) return 'Card';
  return 'Other';
}

function displayMethod(inv: ConsultationBooking): string {
  if (inv.paymentStatus === 'pending') return '—';
  if (isPaidInApp(inv)) return inv.paymentMethodLabel?.includes('UPI') ? 'UPI' : 'App';
  return inv.paymentMethodLabel || '—';
}

type StatusTone = { label: string; className: string };

function invoiceStatus(inv: ConsultationBooking): StatusTone {
  if (inv.paymentStatus === 'refunded') {
    return { label: 'Refunded', className: 'bg-neutral-muted text-neutral-foreground' };
  }
  if (inv.paymentStatus === 'paid') {
    if (isPaidInApp(inv)) {
      return { label: 'Paid in app', className: 'bg-brand-blue/10 text-brand-blue' };
    }
    return { label: 'Paid', className: 'bg-success-muted text-success-foreground' };
  }
  if (inv.queueStatus === 'ready_checkout') {
    return { label: 'Ready', className: 'bg-success-muted text-success-foreground' };
  }
  return { label: 'Pending', className: 'bg-caution-muted text-caution-foreground' };
}

export function PaymentsPage() {
  const { client } = useApi();
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const { data, loading, error, refresh } = useFrontDeskData(
    useCallback((c) => frontDeskApi.getPayments(c, 'all'), []),
  );

  const { data: queue } = useFrontDeskData(useCallback((c) => frontDeskApi.getQueue(c), []));

  const invoices = useMemo(() => {
    const list = data?.invoices ?? [];
    if (filter === 'pending') return list.filter((i) => i.paymentStatus === 'pending');
    if (filter === 'paid') return list.filter((i) => i.paymentStatus === 'paid');
    if (filter === 'refunded') return list.filter((i) => i.paymentStatus === 'refunded');
    return list;
  }, [data, filter]);

  const paidToday = useMemo(
    () => (data?.invoices ?? []).filter((i) => i.paymentStatus === 'paid'),
    [data],
  );

  const paidInApp = useMemo(() => paidToday.filter(isPaidInApp), [paidToday]);
  const paidInAppPaise = paidInApp.reduce((s, i) => s + i.totalPaise, 0);

  const methodTotals = useMemo(() => {
    const buckets: Record<'UPI' | 'Cash' | 'Card' | 'Other', number> = {
      UPI: 0,
      Cash: 0,
      Card: 0,
      Other: 0,
    };
    for (const inv of paidToday) {
      if (isPaidInApp(inv) && !inv.paymentMethodLabel) {
        buckets.UPI += inv.totalPaise;
        continue;
      }
      buckets[normalizeMethod(inv.paymentMethodLabel)] += inv.totalPaise;
    }
    return buckets;
  }, [paidToday]);

  const methodTotalPaise = Object.values(methodTotals).reduce((a, b) => a + b, 0) || 1;

  const pendingFromQueue = useMemo(() => {
    const ready = queue?.readyCheckout ?? [];
    const pendingIds = new Set(
      (data?.invoices ?? []).filter((i) => i.paymentStatus === 'pending').map((i) => i.id),
    );
    const fromReady = ready.filter((b) => pendingIds.has(b.id) || b.paymentStatus === 'pending');
    if (fromReady.length > 0) return fromReady;
    return (data?.invoices ?? []).filter(
      (i) => i.paymentStatus === 'pending' && i.queueStatus === 'ready_checkout',
    );
  }, [queue, data]);

  const handleCollect = async (id: string, method = 'Cash / UPI') => {
    setActionError('');
    setCollectingId(id);
    try {
      await frontDeskApi.collectPayment(client, id, { paymentMethodLabel: method });
      await refresh();
    } catch (err: unknown) {
      setActionError((err as { message?: string })?.message ?? 'Collection failed');
    } finally {
      setCollectingId(null);
    }
  };

  const handleRecordPayment = () => {
    const next = pendingFromQueue[0] ?? data?.invoices.find((i) => i.paymentStatus === 'pending');
    if (next) void handleCollect(next.id);
    else setFilter('pending');
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading payments…</p>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Payments</h1>
            <p className="mt-1 text-sm text-muted">
              Collections, invoices and app payments — synced with the queue
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted hover:bg-background-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
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
              onClick={handleRecordPayment}
              disabled={!summary?.pendingCount}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-on-contrast hover:bg-brand-blue-hover disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Record Payment
            </button>
          </div>
        </div>

        {(error || actionError) && (
          <p className="text-sm text-error">{actionError || error}</p>
        )}

        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-success p-5 text-on-contrast shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-on-contrast/80">
                Collected Today
              </p>
              <span className="rounded-lg bg-on-contrast/15 p-2">
                <Check className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold">
              {formatMoney(summary?.collectedTodayPaise ?? 0)}
            </p>
            <p className="mt-2 text-sm text-on-contrast/85">{summary?.collectedCount ?? 0} payments</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Pending Collection
              </p>
              <span className="rounded-lg bg-danger-muted p-2 text-danger">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">
              {formatMoney(summary?.pendingPaise ?? 0)}
            </p>
            <p className="mt-2 text-sm text-muted">
              {summary?.pendingCount ?? 0} invoices · from Ready lane
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Paid in App</p>
              <span className="rounded-lg bg-brand-blue/10 p-2 text-brand-blue">
                <Smartphone className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{formatMoney(paidInAppPaise)}</p>
            <p className="mt-2 text-sm text-muted">
              {paidInApp.length} of {summary?.collectedCount ?? 0} payments today
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Refunds</p>
              <span className="rounded-lg bg-neutral-muted p-2 text-neutral">
                <RotateCcw className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">
              {formatMoney(summary?.refundsPaise ?? 0)}
            </p>
            <p className="mt-2 text-sm text-muted">
              {summary?.refundsCount ?? 0} processed this week
            </p>
          </div>
        </div>

        {/* Invoices + side panels */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold text-foreground">Invoices</h2>
              <div className="flex rounded-full bg-background p-1 text-xs font-semibold">
                {(
                  [
                    ['all', 'All'],
                    ['pending', 'Pending'],
                    ['paid', 'Paid'],
                    ['refunded', 'Refunds'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`rounded-full px-3.5 py-1.5 transition ${
                      filter === key
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {invoices.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted">No invoices for this filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-muted">
                      <th className="px-5 py-3">Invoice</th>
                      <th className="px-5 py-3">Pet &amp; Owner</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Method</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 12).map((inv) => {
                      const status = invoiceStatus(inv);
                      const canCollect = inv.paymentStatus === 'pending';
                      return (
                        <tr key={inv.id} className="border-b border-border/60 last:border-0">
                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                            {invoiceId(inv)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-foreground">
                              {inv.petName}
                              {inv.petBreed ? (
                                <span className="font-normal text-muted"> · {inv.petBreed}</span>
                              ) : null}
                            </p>
                            <p className="text-xs text-muted">{ownerLabel(inv)}</p>
                          </td>
                          <td className="px-5 py-4 font-semibold text-foreground">
                            {formatMoney(inv.totalPaise)}
                          </td>
                          <td className="px-5 py-4 text-muted">{displayMethod(inv)}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {canCollect ? (
                              <button
                                type="button"
                                onClick={() => void handleCollect(inv.id)}
                                disabled={collectingId === inv.id}
                                className="rounded-lg bg-success px-4 py-2 text-xs font-semibold text-on-contrast hover:bg-success-hover disabled:opacity-50"
                              >
                                {collectingId === inv.id ? '…' : 'Collect'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-muted"
                              >
                                Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {invoices.length > 12 ? (
              <div className="border-t border-border px-5 py-3">
                <button
                  type="button"
                  className="text-sm font-semibold text-brand-blue hover:underline"
                >
                  View all invoices →
                </button>
              </div>
            ) : invoices.length > 0 ? (
              <div className="border-t border-border px-5 py-3">
                <p className="text-xs text-muted">Showing {invoices.length} invoices for today</p>
              </div>
            ) : null}
          </section>

          <aside className="space-y-5">
            {/* Collection by method */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">Collection by method</h2>
              <p className="mt-0.5 text-xs text-muted">Today&apos;s paid invoices</p>
              <ul className="mt-5 space-y-4">
                {(
                  [
                    ['UPI', methodTotals.UPI, 'bg-brand-blue'],
                    ['Cash', methodTotals.Cash, 'bg-success'],
                    ['Card', methodTotals.Card, 'bg-accent'],
                  ] as const
                ).map(([label, paise, bar]) => {
                  const pct = Math.round((paise / methodTotalPaise) * 100);
                  return (
                    <li key={label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="font-semibold text-foreground">{formatMoney(paise)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-background">
                        <div
                          className={`h-full rounded-full ${bar}`}
                          style={{ width: `${Math.max(paise > 0 ? 6 : 0, pct)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Pending from queue */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">Pending from queue</h2>
              <p className="mt-0.5 text-xs text-muted">Fed live by the Ready for Checkout lane</p>

              {pendingFromQueue.length === 0 ? (
                <p className="mt-6 py-4 text-center text-sm text-muted">No pending checkout items.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {pendingFromQueue.slice(0, 5).map((item) => (
                    <li key={item.id} className="rounded-xl border border-border p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {item.petName}
                            {item.petBreed ? (
                              <span className="font-normal text-muted"> · {item.petBreed}</span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted">{ownerLabel(item)}</p>
                        </div>
                        <p className="shrink-0 font-bold text-foreground">
                          {formatMoney(item.totalPaise)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={collectingId === item.id}
                        onClick={() => void handleCollect(item.id)}
                        className="mt-3 w-full rounded-xl bg-success py-2.5 text-xs font-semibold text-on-contrast hover:bg-success-hover disabled:opacity-50"
                      >
                        {collectingId === item.id ? 'Collecting…' : 'Collect now'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
