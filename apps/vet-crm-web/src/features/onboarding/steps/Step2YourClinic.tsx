'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  OnboardingBackLink,
  OnboardingContinueButton,
  OnboardingShell,
} from '../components/OnboardingShell';
import { OnboardingClinicLocation } from '../components/OnboardingClinicLocation';
import { OnboardingWorkingSchedule } from '../components/OnboardingWorkingSchedule';
import { OnboardingServicesPicker } from '../components/OnboardingServicesPicker';
import { useOnboardingDraft } from '../useOnboardingDraft';
import {
  buildStandardWeeklyBlocks,
  isStep1Complete,
} from '../types';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function Step2YourClinic() {
  const router = useRouter();
  const { draft, setDraft, ready } = useOnboardingDraft();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isStep1Complete(draft)) {
      router.replace('/onboarding/about-you');
    }
  }, [draft, ready, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!draft.address.trim()) {
      setError('Please enter your clinic address.');
      return;
    }
    if (!draft.pincode.trim() && !draft.latitude) {
      setError('Locate your clinic on the map or include a pincode in the address.');
      return;
    }
    if (draft.operatingDays.length === 0) {
      setError('Select at least one operating day.');
      return;
    }
    if (draft.closingMinute <= draft.openingMinute) {
      setError('Closing time must be after opening time.');
      return;
    }
    if (draft.selectedServices.length === 0) {
      setError('Select at least one service your clinic offers.');
      return;
    }

    const weeklyAvailability = draft.customizeSchedule
      ? draft.weeklyAvailability
      : buildStandardWeeklyBlocks(
          draft.operatingDays,
          draft.openingMinute,
          draft.closingMinute,
        );

    setDraft({ weeklyAvailability });
    setLoading(true);
    router.push('/onboarding/practice');
  };

  if (!ready) {
    return (
      <OnboardingShell currentStep={2} wide>
        <p className="text-muted">Loading…</p>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell currentStep={2} wide>
      <p className="mb-3 text-sm font-semibold text-onboarding-accent">
        Step 2 of 3 — Your clinic
      </p>
      <h1 className="font-serif text-[2rem] leading-tight font-medium text-foreground sm:text-[2.25rem]">
        Tell us about your clinic
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        This information powers your public listing and helps pet owners find you.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 pb-8">
        <OnboardingClinicLocation
          apiKey={GOOGLE_MAPS_KEY}
          address={draft.address}
          latitude={draft.latitude}
          longitude={draft.longitude}
          onChange={(patch) => setDraft(patch)}
        />

        <OnboardingWorkingSchedule
          operatingDays={draft.operatingDays}
          openingMinute={draft.openingMinute}
          closingMinute={draft.closingMinute}
          customizeSchedule={draft.customizeSchedule}
          weeklyAvailability={draft.weeklyAvailability}
          onChange={(patch) => setDraft(patch)}
        />

        <OnboardingServicesPicker
          selected={draft.selectedServices}
          onChange={(selectedServices) => setDraft({ selectedServices })}
        />

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-5 pt-2">
          <OnboardingContinueButton loading={loading} />
          <OnboardingBackLink href="/onboarding/about-you" />
        </div>
      </form>
    </OnboardingShell>
  );
}
