'use client';

import React from 'react';

export type InvoiceFilter = 'all' | 'pending' | 'paid' | 'refunded';

const FILTERS: { id: InvoiceFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'refunded', label: 'Refunded' },
];

type InvoiceFiltersProps = {
  value: InvoiceFilter;
  onChange: (filter: InvoiceFilter) => void;
};

export function InvoiceFilters({ value, onChange }: InvoiceFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            value === f.id
              ? 'bg-brand-blue text-white'
              : 'bg-background text-muted hover:bg-background-muted hover:text-foreground'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
