'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { ClinicStaffMember, Vet } from '@petspond/types';
import { useApi } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import { useDashboard, vetInitials } from './DashboardContext';

function StaffRow({
  name,
  subtitle,
  badge,
}: {
  name: string;
  subtitle?: string;
  badge?: { label: string; className: string };
}) {
  return (
    <li className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">
        {vetInitials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
      </div>
      {badge ? (
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      ) : null}
    </li>
  );
}

function VetRow({ vet, badgeOverride }: { vet: Vet; badgeOverride?: { label: string; className: string } }) {
  const subtitle = [vet.mobile, vet.email, vet.veterinaryRegistrationNumber]
    .filter(Boolean)
    .join(' · ');
  const badge =
    badgeOverride ??
    (vet.isClinicAdmin
      ? { label: 'Admin', className: 'bg-brand-blue/10 text-brand-blue' }
      : vet.approvalStatus === 'approved'
        ? { label: 'Approved', className: 'bg-success/15 text-success' }
        : { label: 'Pending', className: 'bg-background-muted text-muted' });

  return <StaffRow name={vet.fullName || vet.mobile} subtitle={subtitle || undefined} badge={badge} />;
}

function FrontOfficeRow({ member }: { member: ClinicStaffMember }) {
  const subtitle = [member.mobile, member.email].filter(Boolean).join(' · ');
  return (
    <StaffRow
      name={member.fullName}
      subtitle={subtitle || undefined}
      badge={{ label: 'Front office', className: 'bg-background-muted text-muted' }}
    />
  );
}

function TeamSection({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description?: string;
  empty?: string;
  children: React.ReactNode;
}) {
  const hasChildren = React.Children.count(children) > 0;
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-bold text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      {hasChildren ? (
        <ul className="mt-4">{children}</ul>
      ) : (
        <p className="mt-4 text-sm text-muted">{empty ?? 'No members yet.'}</p>
      )}
    </section>
  );
}

export function TeamPage() {
  const { client } = useApi();
  const { vet, clinic, team, frontOfficeStaff, loading, refresh } = useDashboard();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (vetId: string) => {
    setApprovingId(vetId);
    try {
      await vetAuthApi.approveVet(client, vetId);
      await refresh();
    } catch {
      alert('Could not approve vet.');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted">Loading team…</p>
      </div>
    );
  }

  if (!vet?.isClinicAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="mt-2 max-w-md text-muted">Only clinic admins can manage the team.</p>
        <Link href="/dashboard" className="mt-6 text-sm font-semibold text-brand-blue hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const approvedVets = team.filter((v) => v.approvalStatus === 'approved' || v.isClinicAdmin);
  const pendingApprovalVets = team.filter(
    (v) => v.approvalStatus === 'pending' && v.onboardingCompleted && !v.isClinicAdmin,
  );
  const pendingSignupVets = team.filter((v) => !v.onboardingCompleted && !v.isClinicAdmin);
  const totalCount = approvedVets.length + pendingApprovalVets.length + pendingSignupVets.length + frontOfficeStaff.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team</h1>
            <p className="mt-1 text-sm text-muted">
              {clinic?.name ?? 'Your clinic'} · {totalCount} member{totalCount === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/dashboard/legacy?tab=invites"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-brand-blue/40 hover:bg-brand-blue/5"
          >
            + Invite vet
          </Link>
        </div>

        <div className="space-y-6">
          <TeamSection
            title="Veterinarians"
            description="Doctors with active accounts at your clinic."
            empty="No approved veterinarians yet."
          >
            {approvedVets.map((v) => (
              <VetRow key={v.id} vet={v} />
            ))}
          </TeamSection>

          <TeamSection
            title="Pending approval"
            description="Doctors who joined via invite and are waiting for your approval."
            empty="No vets waiting for approval."
          >
            {pendingApprovalVets.map((v) => (
              <li key={v.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">
                  {vetInitials(v.fullName || v.mobile)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{v.fullName || v.mobile}</p>
                  <p className="truncate text-xs text-muted">{v.mobile}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApprove(v.id)}
                  disabled={approvingId === v.id}
                  className="shrink-0 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  {approvingId === v.id ? 'Approving…' : 'Approve'}
                </button>
              </li>
            ))}
          </TeamSection>

          <TeamSection
            title="Pending veterinarians"
            description="Added to your team — they will be prompted to accept the invitation when they sign in."
            empty="No pending veterinarians."
          >
            {pendingSignupVets.map((v) => (
              <VetRow
                key={v.id}
                vet={v}
                badgeOverride={{
                  label: 'Awaiting signup',
                  className: 'bg-onboarding-accent/15 text-onboarding-accent',
                }}
              />
            ))}
          </TeamSection>

          <TeamSection
            title="Front office staff"
            description="Reception and admin staff added during clinic setup."
            empty="No front office staff added yet."
          >
            {frontOfficeStaff.map((m) => (
              <FrontOfficeRow key={m.id} member={m} />
            ))}
          </TeamSection>
        </div>
      </div>
    </div>
  );
}
