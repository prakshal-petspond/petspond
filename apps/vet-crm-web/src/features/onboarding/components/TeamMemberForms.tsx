'use client';

import React from 'react';
import { VET_EXPERTISE_AREAS } from '../constants';
import { OnboardingField, OnboardingInput } from './OnboardingField';
import type { OnboardingFrontStaffDraft, OnboardingTeamVetDraft } from '../types';

function newLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type VetFormProps = {
  value: Omit<OnboardingTeamVetDraft, 'id'>;
  onChange: (patch: Partial<Omit<OnboardingTeamVetDraft, 'id'>>) => void;
  onSave: () => void;
  onCancel: () => void;
  error?: string;
};

export function VeterinarianForm({ value, onChange, onSave, onCancel, error }: VetFormProps) {
  const toggleSpec = (area: string) => {
    const next = value.specializations.includes(area)
      ? value.specializations.filter((s) => s !== area)
      : [...value.specializations, area];
    onChange({ specializations: next });
  };

  return (
    <div className="rounded-2xl border border-brand-blue/30 bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
          🩺
        </span>
        <div>
          <h3 className="font-bold text-foreground">Add Veterinarian</h3>
          <p className="text-sm text-muted">Medical practitioner for diagnosis and treatment.</p>
        </div>
      </div>

      <div className="space-y-4">
        <OnboardingField label="Veterinarian Name *">
          <OnboardingInput
            value={value.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="Dr. Sarah Johnson"
          />
        </OnboardingField>
        <OnboardingField label="Medical License Number (optional)">
          <OnboardingInput
            value={value.veterinaryRegistrationNumber}
            onChange={(e) => onChange({ veterinaryRegistrationNumber: e.target.value })}
            placeholder="VCI/12/3456/2020"
          />
        </OnboardingField>
        <div className="grid gap-4 sm:grid-cols-2">
          <OnboardingField label="Email Address *">
            <OnboardingInput
              type="email"
              value={value.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="sarah@happytails.in"
            />
          </OnboardingField>
          <OnboardingField label="Phone Number (optional)">
            <OnboardingInput
              type="tel"
              value={value.mobile}
              onChange={(e) => onChange({ mobile: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </OnboardingField>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            Areas of Expertise <span className="font-normal text-muted">(select all that apply)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {VET_EXPERTISE_AREAS.map((area) => {
              const on = value.specializations.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleSpec(area)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    on
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-input-border bg-card text-foreground hover:border-brand-blue/40'
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-hover"
        >
          ✓ Save Veterinarian
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-input-border px-5 py-2.5 text-sm font-semibold text-onboarding-accent hover:bg-background-muted/50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

type StaffFormProps = {
  value: Omit<OnboardingFrontStaffDraft, 'id'>;
  onChange: (patch: Partial<Omit<OnboardingFrontStaffDraft, 'id'>>) => void;
  onSave: () => void;
  onCancel: () => void;
  error?: string;
};

export function FrontOfficeStaffForm({ value, onChange, onSave, onCancel, error }: StaffFormProps) {
  return (
    <div className="rounded-2xl border border-onboarding-accent/30 bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-onboarding-accent text-white">
          🎧
        </span>
        <div>
          <h3 className="font-bold text-foreground">Add Front Office Staff</h3>
          <p className="text-sm text-muted">Reception and appointment management.</p>
        </div>
      </div>

      <div className="space-y-4">
        <OnboardingField label="Staff Member Name *">
          <OnboardingInput
            value={value.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="Priya Sharma"
          />
        </OnboardingField>
        <div className="grid gap-4 sm:grid-cols-2">
          <OnboardingField label="Email Address *">
            <OnboardingInput
              type="email"
              value={value.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="priya@happytails.in"
            />
          </OnboardingField>
          <OnboardingField label="Phone Number (optional)">
            <OnboardingInput
              type="tel"
              value={value.mobile}
              onChange={(e) => onChange({ mobile: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </OnboardingField>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-xl bg-onboarding-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          ✓ Save Staff Member
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-input-border px-5 py-2.5 text-sm font-semibold text-onboarding-accent hover:bg-background-muted/50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function createTeamVetId() {
  return newLocalId();
}

export function createStaffId() {
  return newLocalId();
}

type MemberListProps = {
  items: { id: string; title: string; subtitle: string }[];
  onRemove: (id: string) => void;
  emptyIcon: string;
  emptyText: string;
};

export function TeamMemberList({ items, onRemove, emptyIcon, emptyText }: MemberListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-input-border bg-background/40 px-4 py-8 text-center">
        <p className="text-2xl">{emptyIcon}</p>
        <p className="mt-2 text-sm text-muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-input-border/50 bg-background/50 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
            <p className="truncate text-xs text-muted">{item.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="shrink-0 text-xs font-semibold text-error hover:underline"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
