'use client';

import React from 'react';
import type { ConsultationBooking } from '@petspond/types';
import { avatarColorFor, formatMoney, ownerLabel, petInitials, serviceLabel } from '../shared/utils';
import { PaymentStatusBadge } from './PaymentStatusBadge';

type InvoiceTableProps = {
  invoices: ConsultationBooking[];
  onCollect: (id: string) => void;
  collectingId?: string | null;
};

export function InvoiceTable({ invoices, onCollect, collectingId }: InvoiceTableProps) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-bold text-foreground">Invoices</h2>
        <p className="text-sm text-muted">Today — all desks</p>
      </div>
      {invoices.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted">No invoices for today.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-muted">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Pet &amp; Owner</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">
                    #{inv.invoiceNumber ?? inv.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColorFor(inv.id)}`}
                      >
                        {petInitials(inv.petName)}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{inv.petName}</p>
                        <p className="text-xs text-muted">{ownerLabel(inv)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 capitalize text-foreground">{serviceLabel(inv)}</td>
                  <td className="px-5 py-4 font-semibold text-foreground">{formatMoney(inv.totalPaise)}</td>
                  <td className="px-5 py-4">
                    <PaymentStatusBadge status={inv.paymentStatus} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {inv.paymentStatus === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => onCollect(inv.id)}
                        disabled={collectingId === inv.id}
                        className="rounded-lg bg-success px-4 py-2 text-xs font-semibold text-white hover:bg-success/90 disabled:opacity-50"
                      >
                        {collectingId === inv.id ? 'Collecting…' : 'Collect'}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
