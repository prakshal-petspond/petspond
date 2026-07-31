'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PetspondLogo } from '@/components/PetspondLogo';
import { useDashboard } from '../DashboardContext';
import { ROLE_NAV_ACCESS } from '../roles';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  match?: (pathname: string) => boolean;
};

function IconOverview() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconFrontDesk() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V7a2 2 0 012-2h12a2 2 0 012 2v12" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 19h16M8 10h.01M12 10h.01M16 10h.01M8 14h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPayments() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconPets() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="4" r="2" fill="currentColor" />
      <circle cx="4" cy="9" r="2" fill="currentColor" />
      <circle cx="18" cy="9" r="2" fill="currentColor" />
      <circle cx="7" cy="16" r="2" fill="currentColor" />
      <circle cx="15" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}

function IconOwners() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const WORKSPACE: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: <IconOverview />, match: (p) => p === '/dashboard' },
  {
    href: '/dashboard/check-in',
    label: 'Front Desk',
    icon: <IconFrontDesk />,
    match: (p) => p.startsWith('/dashboard/check-in') || p.startsWith('/dashboard/queue'),
  },
  { href: '/dashboard/payments', label: 'Payment', icon: <IconPayments /> },
];

const DIRECTORY: NavItem[] = [
  { href: '/dashboard/pets', label: 'Pets', icon: <IconPets /> },
  { href: '/dashboard/owners', label: 'Owners', icon: <IconOwners /> },
];

const ADMIN: NavItem[] = [
  { href: '/dashboard/settings', label: 'Settings', icon: <IconSettings /> },
];

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();
  const path = pathname ?? '';

  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.15em] text-muted uppercase">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const base = item.href.split('?')[0]!;
          const active = item.match ? item.match(path) : path === base || path.startsWith(`${base}/`);
          return (
            <li key={`${title}-${item.label}`}>
              <Link
                href={item.href}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-surface-active text-foreground'
                    : 'text-muted hover:bg-background-muted/60 hover:text-foreground'
                }`}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-blue" />
                ) : null}
                <span className={active ? 'text-brand-blue' : 'text-muted'}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge != null && item.badge > 0 ? (
                  <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[10px] font-bold text-on-contrast">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DashboardSidebar() {
  const { role, roleLabel, vet, frontDeskBadges, signOut } = useDashboard();
  const access = ROLE_NAV_ACCESS[role];

  const workspace = WORKSPACE.map((item) => {
    if (item.label === 'Front Desk') {
      const badge = frontDeskBadges.checkIn + frontDeskBadges.queue;
      return badge > 0 ? { ...item, badge } : item;
    }
    return item;
  });

  return (
    <aside className="hidden h-full w-[240px] shrink-0 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
      <div className="mb-8 px-1">
        <PetspondLogo href="/dashboard" imageClassName="h-8 w-auto" />
        <p className="mt-1 text-xs text-muted">Clinic Workspace</p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {access.workspace ? <NavSection title="Workspace" items={workspace} /> : null}
        {access.directory ? <NavSection title="Directory" items={DIRECTORY} /> : null}
        {access.admin ? <NavSection title="Admin" items={ADMIN} /> : null}
      </nav>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-border bg-surface-online px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Clinic is Online</p>
              <p className="text-[11px] text-muted">Accepting bookings</p>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-1 pt-3">
          <p className="truncate text-sm font-semibold text-foreground">{vet?.fullName ?? 'Staff'}</p>
          <p className="text-[11px] text-muted">{roleLabel}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 text-xs font-medium text-muted hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
