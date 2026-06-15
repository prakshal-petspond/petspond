'use client';

import React, { useState } from 'react';

type SearchSectionProps = {
  onSearch: (query: string) => void;
  searching?: boolean;
};

export function SearchSection({ onSearch, searching }: SearchSectionProps) {
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-bold text-foreground">Find an appointment to check in</h2>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by pet name, owner, or phone number…"
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-background-muted"
        >
          <span aria-hidden>▦</span>
          Scan QR / Booking ID
        </button>
        <button
          type="submit"
          disabled={searching}
          className="rounded-xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white hover:bg-brand-blue-hover disabled:opacity-50 sm:hidden"
        >
          Search
        </button>
      </form>
    </section>
  );
}
