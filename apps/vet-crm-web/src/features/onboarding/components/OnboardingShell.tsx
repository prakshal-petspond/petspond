'use client';

import React from 'react';
import Link from 'next/link';
import { ONBOARDING_STEPS } from '../constants';
import { OnboardingLogo } from './OnboardingLogo';

type OnboardingShellProps = {
  currentStep: number;
  children: React.ReactNode;
  /** Wider main column for multi-section forms (step 2). */
  wide?: boolean;
};

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="var(--color-brand-blue)" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepDot({ active }: { active: boolean }) {
  return (
    <span
      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        active ? 'border-brand-blue bg-brand-blue' : 'border-step-muted/40 bg-transparent'
      }`}
    >
      {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
    </span>
  );
}

export function OnboardingShell({ currentStep, children, wide }: OnboardingShellProps) {
  const progressPct = Math.round((currentStep / ONBOARDING_STEPS.length) * 100);

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Sidebar — fixed, does not scroll */}
      <aside className="hidden h-full w-[300px] shrink-0 flex-col overflow-hidden border-r border-input-border/40 bg-background px-8 py-10 lg:flex">
        <OnboardingLogo />

        <div className="mb-8 rounded-2xl border border-input-border/50 bg-card/60 p-4">
          <p className="text-[10px] font-bold tracking-[0.15em] text-muted uppercase">
            Setup progress
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background-muted">
            <div
              className="h-full rounded-full bg-onboarding-accent transition-all duration-300"
              style={{ width: `${Math.max(progressPct, 8)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-step-muted">
            Step {currentStep} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-3">
          {ONBOARDING_STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isLocked = step.id > currentStep;

            return (
              <div
                key={step.slug}
                className={`rounded-2xl px-4 py-4 transition ${
                  isActive
                    ? 'border border-input-border/60 bg-card shadow-sm'
                    : isCompleted
                      ? 'border border-transparent opacity-90'
                      : 'border border-transparent opacity-70'
                }`}
                style={isActive ? { borderLeftWidth: 4, borderLeftColor: 'var(--color-brand-blue)' } : undefined}
              >
                <div className="flex items-start gap-3">
                  {isLocked ? (
                    <span className="mt-0.5 text-step-muted">
                      <LockIcon />
                    </span>
                  ) : isCompleted ? (
                    <span className="mt-0.5">
                      <CheckIcon />
                    </span>
                  ) : (
                    <StepDot active={isActive} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-bold ${
                          isActive ? 'text-foreground' : isCompleted ? 'text-foreground' : 'text-step-muted'
                        }`}
                      >
                        Step {step.id}: {step.title}
                      </p>
                      {isActive ? (
                        <span className="shrink-0 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-semibold text-brand-blue">
                          You are here
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{step.subtitle}</p>
                    {'bullets' in step && isActive ? (
                      <ul className="mt-3 space-y-1 text-xs text-muted">
                        {step.bullets.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-muted" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-8 flex items-start gap-2 rounded-xl bg-sidebar-tip-bg px-4 py-3">
          <span className="text-base leading-none" aria-hidden>
            💡
          </span>
          <p className="text-xs leading-relaxed text-step-muted">
            All information can be edited later
          </p>
        </div>
      </aside>

      {/* Main content — scrollable */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="shrink-0 border-b border-input-border/40 px-6 py-4 lg:hidden">
          <OnboardingLogo />
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background-muted">
            <div
              className="h-full rounded-full bg-onboarding-accent transition-all duration-300"
              style={{ width: `${Math.max(progressPct, 8)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-step-muted">
            Step {currentStep} of {ONBOARDING_STEPS.length}
          </p>
        </div>
        <div className="flex flex-1 justify-center px-6 py-10 sm:px-10 lg:py-14">
          <div className={`w-full ${wide ? 'max-w-[720px]' : 'max-w-[560px]'}`}>{children}</div>
        </div>
      </div>

      {/* Decorative right edge bar */}
      <div
        className="pointer-events-none absolute right-0 top-0 hidden h-full w-2 sm:block"
        aria-hidden
      >
        <div className="h-full w-full bg-background-muted" />
        <div
          className="absolute bottom-0 w-full bg-onboarding-accent"
          style={{ height: `${Math.max(100 - progressPct, 35)}%` }}
        />
      </div>
    </div>
  );
}

export function OnboardingContinueButton({
  loading,
  disabled,
  onClick,
  type = 'submit',
}: {
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-8 py-3.5 text-[15px] font-semibold text-white transition hover:bg-brand-blue-hover disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? 'Saving…' : 'Continue'}
      {!loading ? <span aria-hidden>→</span> : null}
    </button>
  );
}

export function OnboardingBackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-semibold text-onboarding-accent hover:underline"
    >
      <span aria-hidden>←</span> Back
    </Link>
  );
}

export function OnboardingLoginLink() {
  return (
    <Link
      href="/login"
      className="text-sm font-semibold text-onboarding-accent hover:underline"
    >
      I have an account
    </Link>
  );
}
