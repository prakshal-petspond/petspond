'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Plus, Search, TriangleAlert } from 'lucide-react';
import type { ClinicPetDirectoryItem, ClinicPetHealthStatus } from '@petspond/types';
import { useApi } from '@/contexts';
import { directoryApi } from '@/services/directory.service';
import { useFrontDeskData } from '@/features/front-desk/shared/useFrontDeskData';
import { avatarColorFor, petInitials } from '@/features/front-desk/shared/utils';

type SpeciesFilter = 'all' | 'dog' | 'cat' | 'bird' | 'other';

const SPECIES_FILTERS: { id: SpeciesFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dog', label: 'Dogs' },
  { id: 'cat', label: 'Cats' },
  { id: 'bird', label: 'Birds' },
  { id: 'other', label: 'Other' },
];

function speciesLabel(species: string): string {
  const s = species.toLowerCase();
  if (s === 'dog') return 'Dog';
  if (s === 'cat') return 'Cat';
  if (s === 'bird') return 'Bird';
  return species ? species.charAt(0).toUpperCase() + species.slice(1) : 'Other';
}

function lastVisitLabel(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startToday.getTime() - t) / (1000 * 60 * 60 * 24));
  if (t >= startToday.getTime()) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 30) return `${diffDays} days ago`;
  if (diffDays >= 30 && diffDays < 60) return '1 month ago';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
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

function appBadge(pet: ClinicPetDirectoryItem): React.ReactNode {
  if (pet.appStatus === 'on_app') {
    return (
      <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-blue">
        On app
      </span>
    );
  }
  if (pet.appStatus === 'invited') {
    return (
      <span className="rounded-full bg-caution-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-caution-foreground">
        Invited
      </span>
    );
  }
  return <span className="text-muted">—</span>;
}

export function PetsPage() {
  const { client } = useApi();
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState<SpeciesFilter>('all');

  const { data, loading, error } = useFrontDeskData(
    useCallback((c) => directoryApi.listPets(c), []),
  );

  const pets = data?.pets ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pets.filter((p) => {
      if (species !== 'all' && p.species !== species) return false;
      if (!q) return true;
      const hay = [p.name, p.breed, p.ownerName, p.ownerMobile, p.displayId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [pets, query, species]);

  const incompleteCount = data?.summary.incompleteProfiles ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Pets</h1>
            <p className="mt-1 text-sm text-muted">
              {loading ? 'Loading…' : `${data?.summary.total ?? 0} pets on record`}
              {!loading ? ' · every check-in keeps this fresh' : ''}
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
            <Link
              href="/dashboard/owners"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-on-contrast hover:bg-brand-blue-hover"
            >
              <Plus className="h-4 w-4" />
              Add Owner
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by pet, owner or phone…"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-blue"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {SPECIES_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSpecies(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  species === f.id
                    ? 'bg-brand-blue text-on-contrast'
                    : 'border border-border bg-card text-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-end border-b border-border px-5 py-3">
            {incompleteCount > 0 ? (
              <span className="rounded-full bg-caution-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-caution-foreground">
                {incompleteCount} incomplete profile{incompleteCount === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-xs text-muted">{filtered.length} shown</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-bold">Pet</th>
                  <th className="px-4 py-3 font-bold">Species / Breed</th>
                  <th className="px-4 py-3 font-bold">Owner</th>
                  <th className="px-4 py-3 font-bold">Last visit</th>
                  <th className="px-4 py-3 font-bold">On app</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      Loading pets…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      No pets found. Check-ins and bookings will appear here.
                    </td>
                  </tr>
                ) : (
                  filtered.map((pet) => {
                    const status = statusBadge(pet.status);
                    return (
                      <tr
                        key={pet.id}
                        className="border-b border-border/70 last:border-0 hover:bg-background/70"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColorFor(pet.id)}`}
                            >
                              {petInitials(pet.name).slice(0, 1)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">{pet.name}</p>
                              <p className="text-xs text-muted">{pet.displayId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-foreground">
                          {speciesLabel(pet.species)}
                          {pet.breed ? ` · ${pet.breed}` : ''}
                          {pet.ageLabel ? ` · ${pet.ageLabel}` : ''}
                        </td>
                        <td className="px-4 py-3.5">
                          {pet.isWalkIn ? (
                            <span className="text-muted">
                              Walk-in <span className="text-xs">(not linked yet)</span>
                            </span>
                          ) : (
                            <span className="text-foreground">{pet.ownerName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted">{lastVisitLabel(pet.lastVisitAt)}</td>
                        <td className="px-4 py-3.5">{appBadge(pet)}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
