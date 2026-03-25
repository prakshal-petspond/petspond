import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useOnboarding, useApi } from '@/contexts';
import { authApi } from '@/services/auth.service';
import {
  SplashStep,
  IntroStep,
  MobileNumberStep,
  OtpStep,
  NameStep,
  EmailStep,
  LocationPermissionStep,
  PincodeStep,
  RegistrationSuccessStep,
} from './screens';

const STEPS = [
  SplashStep,
  IntroStep,
  MobileNumberStep,
  OtpStep,
  NameStep,
  EmailStep,
  LocationPermissionStep,
  PincodeStep,
] as const;

const SUCCESS_STEP_INDEX = STEPS.length;

export function OnboardingFlow() {
  const router = useRouter();
  const { client } = useApi();
  const { state, setCompleted } = useOnboarding();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const onNext = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const onComplete = useCallback(async () => {
    setCompleting(true);
    try {
      await authApi.completeOnboarding(client, {
        name: state.name,
        email: state.email || undefined,
        city: state.city || undefined,
        pincode: state.pincode || undefined,
      });
      setCompleted(true);
      router.replace('/');
    } catch {
      setCompleting(false);
    }
  }, [client, state.name, state.email, state.city, state.pincode, setCompleted, router]);

  if (step === SUCCESS_STEP_INDEX) {
    return <RegistrationSuccessStep onComplete={onComplete} completing={completing} />;
  }

  const CurrentStep = STEPS[step];
  if (!CurrentStep) return null;

  return <CurrentStep onNext={onNext} onSkip={onNext} />;
}
