'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/contexts';
import { vetAuthApi } from '@/services/vet-auth.service';
import {
  OnboardingContinueButton,
  OnboardingLoginLink,
  OnboardingShell,
} from '../components/OnboardingShell';
import { OnboardingField, OnboardingInput } from '../components/OnboardingField';
import { PhoneVerifySection } from '../components/PhoneVerifySection';
import { useOnboardingDraft, getOnboardingDraft } from '../useOnboardingDraft';

function formatPhoneDisplay(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return mobile;
}

export function Step1AboutYou() {
  const router = useRouter();
  const { client } = useApi();
  const { draft, setDraft, replaceDraft, ready } = useOnboardingDraft();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    if (!ready || prefilled) return;
    vetAuthApi
      .me(client)
      .then((vet) => {
        const stored = getOnboardingDraft();
        replaceDraft({
          ...stored,
          fullName: stored.fullName || vet.fullName || '',
          phone: stored.phone || formatPhoneDisplay(vet.mobile),
          email: stored.email || vet.email || '',
        });
        setPhoneVerified(vet.phoneVerified ?? false);
        setPrefilled(true);
      })
      .catch(() => setPrefilled(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when draft is hydrated
  }, [client, ready, prefilled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullName = draft.fullName.trim();
    const clinicName = draft.clinicName.trim();
    const phone = draft.phone.trim();
    const email = draft.email.trim();

    if (!fullName) {
      setError('Please enter your name.');
      return;
    }
    if (!clinicName) {
      setError("Please enter your clinic's name.");
      return;
    }
    if (!phone.replace(/\D/g, '')) {
      setError('Please enter a phone number.');
      return;
    }
    if (!phoneVerified) {
      setError('Please verify your phone number before continuing.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setDraft({ fullName, clinicName, phone, email });
    setLoading(true);
    router.push('/onboarding/clinic');
  };

  if (!ready) {
    return (
      <OnboardingShell currentStep={1}>
        <p className="text-muted">Loading…</p>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell currentStep={1}>
      <p className="mb-3 text-sm font-semibold text-onboarding-accent">Step 1 of 3 — About you</p>
      <h1 className="font-serif text-[2rem] leading-tight font-medium text-foreground sm:text-[2.25rem]">
        Let&apos;s start with you, then we&apos;ll set up your clinic.
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        A few details and you&apos;ll be ready to receive bookings from pet owners on Petspond.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <OnboardingField label="Your name">
          <OnboardingInput
            value={draft.fullName}
            onChange={(e) => setDraft({ fullName: e.target.value })}
            placeholder="Dr. Anita Rao"
            autoComplete="name"
          />
        </OnboardingField>

        <OnboardingField
          label="Your clinic's name"
          hint="This is what pet owners will see."
        >
          <OnboardingInput
            value={draft.clinicName}
            onChange={(e) => setDraft({ clinicName: e.target.value })}
            placeholder="Happy Tails Animal Hospital"
          />
        </OnboardingField>

        <PhoneVerifySection
          phone={draft.phone}
          onPhoneChange={(phone) => {
            setDraft({ phone });
            setPhoneVerified(false);
          }}
          verified={phoneVerified}
          onVerified={() => setPhoneVerified(true)}
        />

        <OnboardingField label="Email">
          <OnboardingInput
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ email: e.target.value })}
            placeholder="anita@happytails.in"
            autoComplete="email"
          />
        </OnboardingField>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-5 pt-2">
          <OnboardingContinueButton loading={loading} disabled={!phoneVerified} />
          <OnboardingLoginLink />
        </div>
      </form>
    </OnboardingShell>
  );
}
