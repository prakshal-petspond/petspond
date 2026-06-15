'use client';

import React, { useCallback, useState } from 'react';
import { useApi } from '@/contexts';
import { frontDeskApi } from '@/services/front-desk.service';
import { PageHeader } from '../shared/PageHeader';
import { useFrontDeskData } from '../shared/useFrontDeskData';
import { PaymentSummaryCards } from './PaymentSummaryCards';
import { InvoiceFilters, type InvoiceFilter } from './InvoiceFilters';
import { InvoiceTable } from './InvoiceTable';
import { exportInvoicesCsv } from './exportInvoices';

export function PaymentsPage() {
  const { client } = useApi();
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const { data, loading, error, refresh } = useFrontDeskData(
    useCallback((c) => frontDeskApi.getPayments(c, filter), [filter]),
    [filter],
  );

  const handleCollect = async (id: string) => {
    setCollectingId(id);
    try {
      await frontDeskApi.collectPayment(client, id, { paymentMethodLabel: 'Cash / UPI' });
      await refresh();
    } finally {
      setCollectingId(null);
    }
  };

  const handleCollectNext = () => {
    const next = data?.invoices.find((i) => i.paymentStatus === 'pending');
    if (next) {
      void handleCollect(next.id);
      return;
    }
    setFilter('pending');
  };

  const handleExport = () => {
    if (!data?.invoices.length) return;
    exportInvoicesCsv(data.invoices);
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading payments…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1200px] space-y-5">
        <PageHeader
          title="Payments"
          actions={
            <>
              <button
                type="button"
                onClick={handleExport}
                disabled={!data?.invoices.length}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background-muted disabled:opacity-50"
              >
                Export
              </button>
              <button
                type="button"
                onClick={handleCollectNext}
                disabled={!data?.summary.pendingCount}
                className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-hover disabled:opacity-50"
              >
                + Collect Payment
              </button>
            </>
          }
        />

        {error ? <p className="text-sm text-error">{error}</p> : null}

        {data ? <PaymentSummaryCards summary={data.summary} /> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <InvoiceFilters value={filter} onChange={setFilter} />
        </div>

        {data ? (
          <InvoiceTable invoices={data.invoices} onCollect={handleCollect} collectingId={collectingId} />
        ) : null}
      </div>
    </div>
  );
}
