'use client';

import React from 'react';
import type { ConsultationBooking } from '@petspond/types';
import { QueueCard } from './QueueCard';

type QueueColumnProps = {
  title: string;
  dotColor: string;
  count: number;
  bookings: ConsultationBooking[];
  variant: 'waiting' | 'in_consultation' | 'ready_checkout';
  onAdvance?: (id: string) => void;
  advancingId?: string | null;
};

export function QueueColumn({
  title,
  dotColor,
  count,
  bookings,
  variant,
  onAdvance,
  advancingId,
}: QueueColumnProps) {
  return (
    <section className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-background/50 p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <h2 className="font-bold text-foreground">{title}</h2>
        <span className="ml-auto rounded-full bg-card px-2.5 py-0.5 text-xs font-bold text-muted shadow-sm">
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {bookings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No pets here.</p>
        ) : (
          bookings.map((b) => (
            <QueueCard
              key={b.id}
              booking={b}
              variant={variant}
              onAdvance={onAdvance}
              busy={advancingId === b.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
