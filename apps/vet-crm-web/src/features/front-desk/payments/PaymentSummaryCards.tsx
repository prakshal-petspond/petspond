import React from 'react';
import type { PaymentsBoardResponse } from '@petspond/types';
import { formatMoney } from '../shared/utils';

export function PaymentSummaryCards({ summary }: { summary: PaymentsBoardResponse['summary'] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-success/20 bg-success-muted p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-success">Collected Today</p>
          <span className="text-success" aria-hidden>
            💳
          </span>
        </div>
        <p className="mt-3 text-3xl font-bold text-foreground">{formatMoney(summary.collectedTodayPaise)}</p>
        <p className="mt-1 text-sm text-muted">{summary.collectedCount} payments</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pending</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-caution-muted text-caution-foreground">
            ⏱
          </span>
        </div>
        <p className="mt-3 text-3xl font-bold text-foreground">{formatMoney(summary.pendingPaise)}</p>
        <p className="mt-1 text-sm text-muted">{summary.pendingCount} invoices due</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Refunds</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-muted text-danger">
            ↩
          </span>
        </div>
        <p className="mt-3 text-3xl font-bold text-foreground">{formatMoney(summary.refundsPaise)}</p>
        <p className="mt-1 text-sm text-muted">{summary.refundsCount} this week</p>
      </div>
    </div>
  );
}
