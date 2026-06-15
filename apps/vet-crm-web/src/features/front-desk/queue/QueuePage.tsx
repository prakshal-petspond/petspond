'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/contexts';
import { frontDeskApi } from '@/services/front-desk.service';
import { PageHeader } from '../shared/PageHeader';
import { useFrontDeskData } from '../shared/useFrontDeskData';
import { QueueColumn } from './QueueColumn';

export function QueuePage() {
  const { client } = useApi();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const { data: queue, loading, error, refresh } = useFrontDeskData(
    useCallback((c) => frontDeskApi.getQueue(c), []),
  );

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(id);
  }, [autoRefresh, refresh]);

  const handleAdvance = async (bookingId: string) => {
    if (!queue) return;
    const booking =
      queue.waiting.find((b) => b.id === bookingId) ??
      queue.inConsultation.find((b) => b.id === bookingId);
    if (!booking) return;

    const nextStatus =
      booking.queueStatus === 'waiting'
        ? 'in_consultation'
        : booking.queueStatus === 'in_consultation'
          ? 'ready_checkout'
          : null;
    if (!nextStatus) return;

    setAdvancingId(bookingId);
    try {
      await frontDeskApi.updateQueue(client, bookingId, {
        queueStatus: nextStatus,
        ...(nextStatus === 'in_consultation' && { roomLabel: `Room ${(queue.inConsultation.length % 3) + 1}` }),
      });
      await refresh();
    } finally {
      setAdvancingId(null);
    }
  };

  if (loading || !queue) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading queue…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        <PageHeader
          title="Live Queue"
          subtitle={`${queue.stats.petsInClinic} pets in the clinic · avg wait ${queue.stats.avgWaitMinutes} min`}
          actions={
            <>
              <button
                type="button"
                onClick={() => setAutoRefresh((v) => !v)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                  autoRefresh
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                ⟳ Auto-refresh
              </button>
              <Link
                href="/dashboard/check-in"
                className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-hover"
              >
                + Add to Queue
              </Link>
            </>
          }
        />

        {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <QueueColumn
            title="Waiting"
            dotColor="bg-onboarding-accent"
            count={queue.waiting.length}
            bookings={queue.waiting}
            variant="waiting"
            onAdvance={handleAdvance}
            advancingId={advancingId}
          />
          <QueueColumn
            title="In Consultation"
            dotColor="bg-brand-blue"
            count={queue.inConsultation.length}
            bookings={queue.inConsultation}
            variant="in_consultation"
            onAdvance={handleAdvance}
            advancingId={advancingId}
          />
          <QueueColumn
            title="Ready for Checkout"
            dotColor="bg-success"
            count={queue.readyCheckout.length}
            bookings={queue.readyCheckout}
            variant="ready_checkout"
          />
        </div>
      </div>
    </div>
  );
}
