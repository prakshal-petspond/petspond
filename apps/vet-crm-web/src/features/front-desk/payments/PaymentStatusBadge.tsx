import React from 'react';
import type { ConsultationBooking } from '@petspond/types';

export function PaymentStatusBadge({ status }: { status: ConsultationBooking['paymentStatus'] }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-success/15 text-success',
    refunded: 'bg-error/10 text-error',
    failed: 'bg-background-muted text-muted',
  };
  const labels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    refunded: 'Refunded',
    failed: 'Failed',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}
