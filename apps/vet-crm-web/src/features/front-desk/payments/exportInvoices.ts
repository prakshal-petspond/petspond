import type { ConsultationBooking } from '@petspond/types';
import { formatMoney, ownerLabel, serviceLabel } from '../shared/utils';

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportInvoicesCsv(invoices: ConsultationBooking[]): void {
  const header = ['Invoice', 'Pet', 'Owner', 'Service', 'Amount', 'Status', 'Date'];
  const rows = invoices.map((inv) => [
    inv.invoiceNumber ?? inv.id,
    inv.petName,
    ownerLabel(inv),
    serviceLabel(inv),
    formatMoney(inv.totalPaise),
    inv.paymentStatus,
    new Date(inv.scheduledAt).toISOString(),
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
