'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PetspondLogo } from '@/components/PetspondLogo';
import { useDashboard } from '../DashboardContext';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  match?: (pathname: string) => boolean;
};

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconCheckIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconQueue() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
  { href: '/dashboard', label: 'Dashboard', icon: <IconDashboard />, match: (p) => p === '/dashboard' },
  { href: '/dashboard/check-in', label: 'Check-in', icon: <IconCheckIn /> },
  { href: '/dashboard/queue', label: 'Queue', icon: <IconQueue /> },
  { href: '/dashboard/payments', label: 'Payments', icon: <IconPayments /> },
];

const CUSTOMERS: NavItem[] = [
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-background-muted text-foreground'
                    : 'text-muted hover:bg-background-muted/60 hover:text-foreground'
                }`}
              >
                <span className={active ? 'text-brand-blue' : 'text-muted'}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge != null ? (
                  <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[10px] font-bold text-white">
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
  const { vet, signOut, frontDeskBadges } = useDashboard();

  const workspace = WORKSPACE.map((item) => {
    if (item.label === 'Check-in' && frontDeskBadges.checkIn > 0) {
      return { ...item, badge: frontDeskBadges.checkIn };
    }
    if (item.label === 'Queue' && frontDeskBadges.queue > 0) {
      return { ...item, badge: frontDeskBadges.queue };
    }
    return item;
  });

  return (
    <aside className="hidden h-full w-[240px] shrink-0 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
      <div className="mb-8 px-1">
        <PetspondLogo href="/dashboard" imageClassName="h-8 w-auto" />
        <p className="mt-1 text-xs text-muted">Vet CRM</p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <NavSection title="Workspace" items={workspace} />
        <NavSection title="Customers" items={CUSTOMERS} />
        <NavSection title="Admin" items={ADMIN} />
      </nav>

      <div className="mt-4 border-t border-border pt-4 px-1">
        <p className="truncate text-sm font-semibold text-foreground">{vet?.fullName ?? 'Staff'}</p>
        <button
          type="button"
          onClick={signOut}
          className="mt-1 text-xs font-medium text-muted hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
