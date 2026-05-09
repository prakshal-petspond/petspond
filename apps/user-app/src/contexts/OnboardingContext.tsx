import React, { createContext, useContext, useCallback, useState, type ReactNode } from 'react';

export interface OnboardingState {
  mobile: string;
  otp: string;
  name: string;
  email: string;
  /** Selected preference ids from onboarding (client-side until API supports them). */
  preferences: string[];
  completed: boolean;
}

const initialState: OnboardingState = {
  mobile: '',
  otp: '',
  name: '',
  email: '',
  preferences: [],
  completed: false,
};

type OnboardingContextValue = {
  state: OnboardingState;
  setMobile: (v: string) => void;
  setOtp: (v: string) => void;
  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPreferences: (v: string[]) => void;
  setCompleted: (v: boolean) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);

  const setMobile = useCallback((mobile: string) => setState((s) => ({ ...s, mobile })), []);
  const setOtp = useCallback((otp: string) => setState((s) => ({ ...s, otp })), []);
  const setName = useCallback((name: string) => setState((s) => ({ ...s, name })), []);
  const setEmail = useCallback((email: string) => setState((s) => ({ ...s, email })), []);
  const setPreferences = useCallback((preferences: string[]) => setState((s) => ({ ...s, preferences })), []);
  const setCompleted = useCallback((completed: boolean) => setState((s) => ({ ...s, completed })), []);
  const reset = useCallback(() => setState(initialState), []);

  const value: OnboardingContextValue = {
    state,
    setMobile,
    setOtp,
    setName,
    setEmail,
    setPreferences,
    setCompleted,
    reset,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
