'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from '../DashboardContext';

type NavItem = { href: string; label: string; badge?: number };

const WORKSPACE: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/legacy?tab=bookings', label: 'Appointments', badge: 5 },
  { href: '/dashboard/records', label: 'Records' },
];

const PATIENTS: NavItem[] = [
  { href: '/dashboard/pets', label: 'Pets' },
  { href: '/dashboard/owners', label: 'Owners' },
];

const CLINIC: NavItem[] = [
  { href: '/dashboard/team', label: 'Team' },
  { href: '/dashboard/legacy?tab=clinic', label: 'Profile' },
  { href: '/dashboard/settings', label: 'Settings' },
];

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.15em] text-muted uppercase">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href.split('?')[0]!);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-blue/10 text-brand-blue'
                    : 'text-foreground hover:bg-background-muted/80'
                }`}
              >
                <span>{item.label}</span>
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
  const { consultations } = useDashboard();
  const pendingCount = consultations.filter(
    (c) => c.status === 'pending_payment' || c.status === 'scheduled',
  ).length;

  const workspace = WORKSPACE.map((item) =>
    item.label === 'Appointments' && pendingCount > 0
      ? { ...item, badge: pendingCount }
      : item.label === 'Appointments'
        ? { ...item, badge: undefined }
        : item,
  );

  return (
    <aside className="hidden h-full w-[220px] shrink-0 flex-col border-r border-border bg-card px-3 py-6 lg:flex">
      <NavSection title="Workspace" items={workspace} />
      <NavSection title="Patients" items={PATIENTS} />
      <NavSection title="Clinic" items={CLINIC} />
    </aside>
  );
}
