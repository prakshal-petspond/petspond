'use client';

import { useCallback, useEffect, useState } from 'react';
import { ONBOARDING_DRAFT_KEY } from './constants';
import { EMPTY_ONBOARDING_DRAFT, type OnboardingDraft } from './types';

export function getOnboardingDraft(): OnboardingDraft {
  return readDraft();
}

function readDraft(): OnboardingDraft {
  if (typeof window === 'undefined') return EMPTY_ONBOARDING_DRAFT;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return EMPTY_ONBOARDING_DRAFT;
    return { ...EMPTY_ONBOARDING_DRAFT, ...JSON.parse(raw) };
  } catch {
    return EMPTY_ONBOARDING_DRAFT;
  }
}

export function useOnboardingDraft() {
  const [draft, setDraftState] = useState<OnboardingDraft>(EMPTY_ONBOARDING_DRAFT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDraftState(readDraft());
    setReady(true);
  }, []);

  const setDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraftState((prev) => {
      const next = { ...prev, ...patch };
      sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const replaceDraft = useCallback((next: OnboardingDraft) => {
    sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(next));
    setDraftState(next);
  }, []);

  return { draft, setDraft, replaceDraft, ready };
}
