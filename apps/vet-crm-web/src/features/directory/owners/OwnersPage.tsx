'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Plus, Search, TriangleAlert } from 'lucide-react';
import type { ClinicOwnerDirectoryItem } from '@petspond/types';
import { useApi } from '@/contexts';
import { directoryApi } from '@/services/directory.service';
import { useFrontDeskData } from '@/features/front-desk/shared/useFrontDeskData';
import { avatarColorFor, formatMoney } from '@/features/front-desk/shared/utils';

function ownerProfileHref(ownerId: string): string {
  return `/dashboard/owners/${encodeURIComponent(ownerId)}`;
}

type OwnerFilter = 'all' | 'on_app' | 'invited' | 'payment_due';

const FILTERS: { id: OwnerFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'on_app', label: 'On app' },
  { id: 'invited', label: 'Invited' },
  { id: 'payment_due', label: 'Payment due' },
];

function formatPhone(mobile?: string): string {
  if (!mobile) return '—';
  const digits = mobile.replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return mobile;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function relativeVisitLabel(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startToday.getTime() - t) / (1000 * 60 * 60 * 24));
  if (t >= startToday.getTime()) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 30) return `${diffDays} days ago`;
  if (diffDays >= 30 && diffDays < 60) return '1 month ago';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function isInvitedJustNow(iso?: string): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 2 * 60 * 60 * 1000;
}

function appBadge(owner: ClinicOwnerDirectoryItem): React.ReactNode {
  if (owner.appStatus === 'on_app') {
    return (
      <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-blue">
        On app
      </span>
    );
  }
  if (owner.appStatus === 'invited') {
    const justNow = isInvitedJustNow(owner.invitedAt);
    return (
      <span className="rounded-full bg-caution-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-caution-foreground">
        {justNow ? 'Invited · Just now' : 'Invited'}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-neutral-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-foreground">
      Walk-in
    </span>
  );
}

function ownerInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

export function OwnersPage() {
  const { client } = useApi();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<OwnerFilter>('all');
  const [resendToast, setResendToast] = useState('');

  const { data, loading, error } = useFrontDeskData(
    useCallback((c) => directoryApi.listOwners(c), []),
  );

  const owners = data?.owners ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return owners.filter((o) => {
      if (filter === 'on_app' && o.appStatus !== 'on_app') return false;
      if (filter === 'invited' && o.appStatus !== 'invited') return false;
      if (filter === 'payment_due' && o.amountDuePaise <= 0) return false;
      if (!q) return true;
      const hay = [o.name, o.mobile, ...o.pets.map((p) => `${p.name} ${p.breed}`)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [owners, query, filter]);

  const onAppPct =
    data && data.summary.total > 0
      ? Math.round((data.summary.onAppCount / data.summary.total) * 100)
      : 0;

  const handleResendInvite = (owner: ClinicOwnerDirectoryItem) => {
    setResendToast(`Invite queued for ${owner.name}${owner.mobile ? ` (${formatPhone(owner.mobile)})` : ''}`);
    window.setTimeout(() => setResendToast(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Owners</h1>
            <p className="mt-1 text-sm text-muted">
              {loading ? 'Loading…' : `${data?.summary.total ?? 0} pet parents`}
              {!loading ? ' · phone number is the identity everywhere' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted hover:bg-background-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-emergency px-4 py-2.5 text-sm font-semibold text-on-contrast hover:bg-emergency-hover"
            >
              <TriangleAlert className="h-4 w-4" />
              Emergency
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-on-contrast hover:bg-brand-blue-hover"
            >
              <Plus className="h-4 w-4" />
              Add Owner
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or phone…"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-blue"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  filter === f.id
                    ? 'bg-brand-blue text-on-contrast'
                    : 'border border-border bg-card text-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
            {!loading && data && data.summary.total > 0 ? (
              <span className="ml-1 text-xs font-bold uppercase tracking-wide text-brand-blue">
                {onAppPct}% on app
              </span>
            ) : null}
          </div>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {resendToast ? (
          <p className="rounded-xl bg-caution-muted px-4 py-2 text-sm text-caution-foreground">
            {resendToast}
          </p>
        ) : null}

        {loading ? (
          <p className="py-16 text-center text-sm text-muted">Loading owners…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            No owners found. Check-ins and bookings will populate this directory.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((owner) => (
              <OwnerCard
                key={owner.id}
                owner={owner}
                onResendInvite={() => handleResendInvite(owner)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OwnerCard({
  owner,
  onResendInvite,
}: {
  owner: ClinicOwnerDirectoryItem;
  onResendInvite: () => void;
}) {
  const visitPrefix = owner.isFirstVisit ? 'First visit' : 'Last visit';

  return (
    <li className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColorFor(owner.id)}`}
        >
          {ownerInitial(owner.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{owner.name}</p>
              <p className="truncate text-sm text-muted">{formatPhone(owner.mobile)}</p>
            </div>
            {appBadge(owner)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Pets</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {owner.pets.length === 0 ? (
            <span className="text-sm text-muted">No pets on file</span>
          ) : (
            owner.pets.map((p) => (
              <span
                key={`${p.name}-${p.breed}`}
                className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {p.name}
                {p.breed ? ` · ${p.breed}` : ''}
              </span>
            ))
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">
        {visitPrefix} · {relativeVisitLabel(owner.lastVisitAt)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
        <Link
          href={ownerProfileHref(owner.id)}
          className="text-sm font-semibold text-brand-blue hover:underline"
        >
          View profile →
        </Link>
        {owner.appStatus === 'invited' ? (
          <button
            type="button"
            onClick={onResendInvite}
            className="text-sm font-semibold text-caution-foreground hover:underline"
          >
            Resend invite
          </button>
        ) : owner.amountDuePaise > 0 ? (
          <span className="text-sm font-bold text-danger">
            {formatMoney(owner.amountDuePaise)} due
          </span>
        ) : (
          <span />
        )}
      </div>
    </li>
  );
}
