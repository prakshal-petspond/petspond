'use client';

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
} from 'lucide-react';
import type {
  ClinicOwnerActivityItem,
  ClinicOwnerProfilePet,
  ClinicPetHealthStatus,
} from '@petspond/types';
import { useApi } from '@/contexts';
import { directoryApi } from '@/services/directory.service';
import { useFrontDeskData } from '@/features/front-desk/shared/useFrontDeskData';
import {
  avatarColorFor,
  formatMoney,
  petInitials,
} from '@/features/front-desk/shared/utils';

function formatPhone(mobile?: string): string {
  if (!mobile) return '—';
  const digits = mobile.replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return mobile;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function shortDate(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  if (t >= startToday.getTime()) return 'Today';
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function activityWhen(iso: string): string {
  const d = new Date(iso);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  if (d.getTime() >= startToday.getTime()) {
    return `Today · ${d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  }
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function relativeVisit(iso?: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startToday.getTime() - t) / (1000 * 60 * 60 * 24));
  if (t >= startToday.getTime()) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 30) return `${diffDays} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function speciesLabel(species: string): string {
  const s = species.toLowerCase();
  if (s === 'dog') return 'Dog';
  if (s === 'cat') return 'Cat';
  if (s === 'bird') return 'Bird';
  return species ? species.charAt(0).toUpperCase() + species.slice(1) : 'Other';
}

function statusBadge(status: ClinicPetHealthStatus): { label: string; className: string } {
  switch (status) {
    case 'healthy':
      return { label: 'Healthy', className: 'bg-success-muted text-success-foreground' };
    case 'vaccination_due':
      return { label: 'Vaccination due', className: 'bg-danger-muted text-danger-foreground' };
    case 'under_treatment':
      return { label: 'Under treatment', className: 'bg-info-muted text-info-foreground' };
    case 'incomplete':
      return { label: 'Incomplete', className: 'bg-caution-muted text-caution-foreground' };
  }
}

function methodBadge(method: string): { label: string; className: string } {
  const m = method.toLowerCase();
  if (m.includes('upi') || m.includes('app') || m.includes('stripe')) {
    return { label: method || 'UPI', className: 'bg-brand-blue/10 text-brand-blue' };
  }
  return { label: method || '—', className: 'bg-neutral-muted text-neutral-foreground' };
}

function activityDotClass(kind: ClinicOwnerActivityItem['kind']): string {
  if (kind === 'checked_in' || kind === 'payment') return 'bg-brand-blue';
  if (kind === 'pet_added') return 'bg-success';
  if (kind === 'booked') return 'bg-caution';
  return 'bg-neutral';
}

export function OwnerProfilePage({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const { client } = useApi();
  const decodedId = useMemo(() => {
    try {
      return decodeURIComponent(ownerId);
    } catch {
      return ownerId;
    }
  }, [ownerId]);

  const { data, loading, error } = useFrontDeskData(
    useCallback((c) => directoryApi.getOwner(c, decodedId), [decodedId]),
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading owner profile…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-error">{error || 'Owner not found'}</p>
        <Link href="/dashboard/owners" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to owners
        </Link>
      </div>
    );
  }

  const { owner, payments, pets, activity, allPaid } = data;
  const recentPayments = payments.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/owners')}
              className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted hover:bg-background-muted hover:text-foreground"
              aria-label="Back to owners"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Owner Profile</h1>
              <p className="mt-1 text-sm text-muted">
                Owners <span className="text-foreground/40">›</span> {owner.name}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-on-contrast hover:bg-brand-blue-hover"
            >
              <Plus className="h-4 w-4" />
              Add pet
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background-muted"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {/* Owner info */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <span
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold ${avatarColorFor(owner.id)}`}
              >
                {owner.name.trim().slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{owner.name}</h2>
                  {owner.appStatus === 'on_app' ? (
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-blue">
                      On app
                    </span>
                  ) : owner.appStatus === 'invited' ? (
                    <span className="rounded-full bg-caution-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-caution-foreground">
                      Invited
                    </span>
                  ) : null}
                  {owner.memberSinceYear ? (
                    <span className="rounded-full bg-neutral-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-foreground">
                      Member since {owner.memberSinceYear}
                    </span>
                  ) : null}
                </div>
                <ul className="mt-4 space-y-2.5 text-sm text-foreground">
                  <li className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                    <span>{formatPhone(owner.mobile)}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                    <span className={owner.email ? '' : 'text-muted'}>
                      {owner.email || 'No email on file'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                    <span className={owner.address ? '' : 'text-muted'}>
                      {owner.address || 'No address on file'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 divide-x divide-border border-t border-border pt-4">
              <Stat
                label="Lifetime spend"
                value={formatMoney(owner.lifetimeSpendPaise)}
              />
              <Stat label="Visits" value={String(owner.visitCount)} />
              <Stat label="Pets" value={String(pets.length)} />
            </div>
          </section>

          {/* Payment history */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">Payment history</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    allPaid
                      ? 'bg-success-muted text-success-foreground'
                      : 'bg-danger-muted text-danger-foreground'
                  }`}
                >
                  {allPaid ? 'All paid' : `${formatMoney(owner.amountDuePaise)} due`}
                </span>
              </div>
              <Link
                href="/dashboard/payments"
                className="text-sm font-semibold text-brand-blue hover:underline"
              >
                View all →
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted">No payments yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wide text-muted">
                      <th className="pb-2 font-bold">Date</th>
                      <th className="pb-2 font-bold">For</th>
                      <th className="pb-2 font-bold">Amount</th>
                      <th className="pb-2 font-bold">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p) => {
                      const method = methodBadge(p.methodLabel);
                      return (
                        <tr key={p.id} className="border-t border-border/70">
                          <td className="py-2.5 text-muted">{shortDate(p.date)}</td>
                          <td className="py-2.5 text-foreground">
                            {p.petName} · {p.serviceLabel}
                          </td>
                          <td className="py-2.5 font-semibold text-foreground">
                            {formatMoney(p.amountPaise)}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${method.className}`}
                            >
                              {method.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Pets */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">Pets</h3>
                <span className="rounded-full bg-neutral-muted px-2 py-0.5 text-xs font-bold text-neutral-foreground">
                  {pets.length}
                </span>
              </div>
              <button type="button" className="text-sm font-semibold text-brand-blue hover:underline">
                + Add pet
              </button>
            </div>
            {pets.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted">No pets on file for this owner.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {pets.map((pet) => (
                  <PetRow key={pet.id} pet={pet} />
                ))}
              </ul>
            )}
          </section>

          {/* Recent activity */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-foreground">Recent activity</h3>
              <button type="button" className="text-sm font-semibold text-brand-blue hover:underline">
                View all →
              </button>
            </div>
            {activity.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted">No activity yet.</p>
            ) : (
              <ol className="relative mt-5 space-y-5 border-l border-border pl-5">
                {activity.slice(0, 8).map((item) => (
                  <li key={item.id} className="relative">
                    <span
                      className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-card ${activityDotClass(item.kind)}`}
                    />
                    <p className="text-xs font-semibold text-muted">{activityWhen(item.at)}</p>
                    <p className="mt-0.5 font-semibold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 text-center first:pl-0 last:pr-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function PetRow({ pet }: { pet: ClinicOwnerProfilePet }) {
  const status = statusBadge(pet.status);
  return (
    <li className="rounded-xl border border-border bg-background/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColorFor(pet.id)}`}
        >
          {petInitials(pet.name).slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{pet.name}</p>
              <p className="truncate text-sm text-muted">
                {speciesLabel(pet.species)}
                {pet.breed ? ` · ${pet.breed}` : ''}
                {pet.ageLabel ? ` · ${pet.ageLabel}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
                {status.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              Weight <span className="font-semibold text-foreground">{pet.weightLabel || '—'}</span>
            </span>
            <span>
              Last visit{' '}
              <span className="font-semibold text-foreground">{relativeVisit(pet.lastVisitAt)}</span>
            </span>
            <span>
              Next due{' '}
              <span className="font-semibold text-foreground">{pet.nextDueLabel || '—'}</span>
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
