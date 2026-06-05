'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import {
  OnboardingBackLink,
  OnboardingShell,
} from '../components/OnboardingShell';
import { TeamOverviewCard } from '../components/TeamOverviewCard';
import {
  createStaffId,
  createTeamVetId,
  FrontOfficeStaffForm,
  TeamMemberList,
  VeterinarianForm,
} from '../components/TeamMemberForms';
import { ONBOARDING_DRAFT_KEY } from '../constants';
import { useOnboardingDraft } from '../useOnboardingDraft';
import {
  buildStandardWeeklyBlocks,
  EMPTY_FRONT_STAFF,
  EMPTY_TEAM_VET,
  isStep1Complete,
  isStep2Complete,
  selectedServiceItems,
  type OnboardingDraft,
} from '../types';

function buildSetupPayload(draft: OnboardingDraft) {
  const weeklyAvailability = draft.customizeSchedule
    ? draft.weeklyAvailability
    : buildStandardWeeklyBlocks(
        draft.operatingDays,
        draft.openingMinute,
        draft.closingMinute,
      );

  return {
    fullName: draft.fullName.trim(),
    clinicName: draft.clinicName.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim() || undefined,
    address: draft.address.trim(),
    pincode: draft.pincode.trim() || '000000',
    city: draft.city.trim() || undefined,
    state: draft.state.trim() || undefined,
    latitude: draft.latitude ?? undefined,
    longitude: draft.longitude ?? undefined,
    placeId: draft.placeId || undefined,
    weeklyAvailability,
    servicesOffered: selectedServiceItems(draft.selectedServices),
    additionalVeterinarians: draft.additionalVeterinarians.map((v) => ({
      fullName: v.fullName.trim(),
      email: v.email.trim() || undefined,
      mobile: v.mobile.trim() || undefined,
      veterinaryRegistrationNumber: v.veterinaryRegistrationNumber.trim() || undefined,
      specializations: v.specializations,
    })),
    frontOfficeStaff: draft.frontOfficeStaff.map((s) => ({
      fullName: s.fullName.trim(),
      email: s.email.trim() || undefined,
      mobile: s.mobile.trim() || undefined,
    })),
  };
}

export function Step3PracticeDetails() {
  const router = useRouter();
  const { client } = useApi();
  const { draft, setDraft, ready } = useOnboardingDraft();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [showVetForm, setShowVetForm] = useState(false);
  const [vetForm, setVetForm] = useState(EMPTY_TEAM_VET);
  const [vetFormError, setVetFormError] = useState('');

  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState(EMPTY_FRONT_STAFF);
  const [staffFormError, setStaffFormError] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!isStep1Complete(draft)) {
      router.replace('/onboarding/about-you');
      return;
    }
    if (!isStep2Complete(draft)) {
      router.replace('/onboarding/clinic');
    }
  }, [draft, ready, router]);

  const saveVet = () => {
    setVetFormError('');
    if (!vetForm.fullName.trim()) {
      setVetFormError('Veterinarian name is required.');
      return;
    }
    if (!vetForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vetForm.email.trim())) {
      setVetFormError('A valid email address is required.');
      return;
    }
    setDraft({
      additionalVeterinarians: [
        ...draft.additionalVeterinarians,
        { ...vetForm, id: createTeamVetId() },
      ],
    });
    setVetForm(EMPTY_TEAM_VET);
    setShowVetForm(false);
  };

  const saveStaff = () => {
    setStaffFormError('');
    if (!staffForm.fullName.trim()) {
      setStaffFormError('Staff member name is required.');
      return;
    }
    if (!staffForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffForm.email.trim())) {
      setStaffFormError('A valid email address is required.');
      return;
    }
    setDraft({
      frontOfficeStaff: [...draft.frontOfficeStaff, { ...staffForm, id: createStaffId() }],
    });
    setStaffForm(EMPTY_FRONT_STAFF);
    setShowStaffForm(false);
  };

  const handleComplete = async () => {
    setError('');
    setSubmitting(true);
    try {
      await vetAuthApi.completeClinicSetup(client, buildSetupPayload(draft));
      sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Could not complete setup. Try again.');
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <OnboardingShell currentStep={3} wide>
        <p className="text-muted">Loading…</p>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell currentStep={3} wide>
      <p className="mb-3 text-sm font-semibold text-onboarding-accent">
        Step 3 of 3 — Practice details
      </p>
      <h1 className="font-serif text-[2rem] leading-tight font-medium text-foreground sm:text-[2.25rem]">
        Build your team
      </h1>
      <p className="mt-2 text-lg font-medium text-foreground">Add doctors, office staff</p>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Add your team members to collaborate and manage appointments at {draft.clinicName || 'your clinic'}.
      </p>

      <div className="mt-8 space-y-6 pb-8">
        <TeamOverviewCard
          vetCount={draft.additionalVeterinarians.length}
          staffCount={draft.frontOfficeStaff.length}
          clinicName={draft.clinicName}
        />

        <section className="rounded-2xl border border-input-border/50 bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
                🩺
              </span>
              <div>
                <h2 className="font-bold text-foreground">Add Veterinarian</h2>
                <p className="text-sm text-muted">Medical practitioner for diagnosis and treatment.</p>
              </div>
            </div>
            {!showVetForm ? (
              <button
                type="button"
                onClick={() => setShowVetForm(true)}
                className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-hover"
              >
                + Add Vet
              </button>
            ) : null}
          </div>

          {showVetForm ? (
            <VeterinarianForm
              value={vetForm}
              onChange={(patch) => setVetForm((prev) => ({ ...prev, ...patch }))}
              onSave={saveVet}
              onCancel={() => {
                setShowVetForm(false);
                setVetForm(EMPTY_TEAM_VET);
                setVetFormError('');
              }}
              error={vetFormError}
            />
          ) : (
            <TeamMemberList
              items={draft.additionalVeterinarians.map((v) => ({
                id: v.id,
                title: v.fullName,
                subtitle: [v.email, v.specializations.slice(0, 2).join(', ')].filter(Boolean).join(' · '),
              }))}
              onRemove={(id) =>
                setDraft({
                  additionalVeterinarians: draft.additionalVeterinarians.filter((v) => v.id !== id),
                })
              }
              emptyIcon="🩺"
              emptyText="No veterinarian added yet. Click 'Add Vet' to get started."
            />
          )}
        </section>

        <section className="rounded-2xl border border-input-border/50 bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-onboarding-accent text-white">
                🎧
              </span>
              <div>
                <h2 className="font-bold text-foreground">Add Front Office Staff</h2>
                <p className="text-sm text-muted">Reception and appointment management.</p>
              </div>
            </div>
            {!showStaffForm ? (
              <button
                type="button"
                onClick={() => setShowStaffForm(true)}
                className="rounded-xl bg-onboarding-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                + Add Staff
              </button>
            ) : null}
          </div>

          {showStaffForm ? (
            <FrontOfficeStaffForm
              value={staffForm}
              onChange={(patch) => setStaffForm((prev) => ({ ...prev, ...patch }))}
              onSave={saveStaff}
              onCancel={() => {
                setShowStaffForm(false);
                setStaffForm(EMPTY_FRONT_STAFF);
                setStaffFormError('');
              }}
              error={staffFormError}
            />
          ) : (
            <TeamMemberList
              items={draft.frontOfficeStaff.map((s) => ({
                id: s.id,
                title: s.fullName,
                subtitle: s.email,
              }))}
              onRemove={(id) =>
                setDraft({
                  frontOfficeStaff: draft.frontOfficeStaff.filter((s) => s.id !== id),
                })
              }
              emptyIcon="👤"
              emptyText="No front office staff added yet. Click 'Add Staff' to get started."
            />
          )}
        </section>

        <div className="flex items-start gap-3 rounded-xl bg-sidebar-tip-bg px-4 py-4">
          <span className="text-lg" aria-hidden>
            💡
          </span>
          <p className="text-sm leading-relaxed text-step-muted">
            <strong className="font-semibold text-foreground">Team members optional.</strong> You can skip this step
            and add veterinarians and staff members later from your clinic dashboard.
          </p>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleComplete()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-8 py-3.5 text-[15px] font-semibold text-white transition hover:bg-brand-blue-hover disabled:opacity-50"
          >
            {submitting ? 'Completing…' : 'Complete Setup ✓'}
          </button>
          <OnboardingBackLink href="/onboarding/clinic" />
        </div>
      </div>
    </OnboardingShell>
  );
}
