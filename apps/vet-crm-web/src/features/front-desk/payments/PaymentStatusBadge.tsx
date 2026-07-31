import React from 'react';
import type { ConsultationBooking } from '@petspond/types';

export function PaymentStatusBadge({ status }: { status: ConsultationBooking['paymentStatus'] }) {
  const styles: Record<string, string> = {
    pending: 'bg-caution-muted text-caution-foreground',
    paid: 'bg-success-muted text-success-foreground',
    refunded: 'bg-danger-muted text-danger-foreground',
    failed: 'bg-neutral-muted text-neutral-foreground',
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
