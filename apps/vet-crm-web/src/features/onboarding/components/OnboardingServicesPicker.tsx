'use client';

import React from 'react';
import { ONBOARDING_CLINIC_SERVICES } from '../constants';
import { OnboardingSectionCard } from './OnboardingSectionCard';

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 8V6a4 4 0 1 1 8 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 8h14l-1.2 12H6.2L5 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 12.5l3 3 9-9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type OnboardingServicesPickerProps = {
  selected: string[];
  onChange: (ids: string[]) => void;
};

export function OnboardingServicesPicker({ selected, onChange }: OnboardingServicesPickerProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const count = selected.length;

  return (
    <OnboardingSectionCard
      icon={<BagIcon />}
      iconBg="blue"
      title="Services Offered"
      subtitle="Select all veterinary services your clinic provides to pet owners"
    >
      <div className="flex flex-wrap gap-2.5">
        {ONBOARDING_CLINIC_SERVICES.map((service) => {
          const isOn = selected.includes(service.id);
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggle(service.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                isOn
                  ? 'border-onboarding-accent bg-onboarding-accent text-white'
                  : 'border-input-border bg-card text-foreground hover:border-onboarding-accent/50'
              }`}
            >
              {isOn ? <CheckIcon /> : null}
              {service.name}
            </button>
          );
        })}
      </div>

      <p className="mt-4 rounded-xl bg-background-muted/60 px-4 py-2.5 text-center text-xs text-muted">
        {count === 0
          ? 'Select at least one service'
          : `${count} service${count === 1 ? '' : 's'} selected`}
      </p>
    </OnboardingSectionCard>
  );
}
