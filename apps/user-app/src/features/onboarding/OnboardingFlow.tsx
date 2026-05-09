import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useOnboarding, useApi } from '@/contexts';
import { authApi } from '@/services/auth.service';
import {
  CarouselScreen,
  MobileNumberScreen,
  OtpScreen,
  NameScreen,
  EmailScreen,
  PreferencesScreen,
} from './screens';

export function OnboardingFlow() {
  const router = useRouter();
  const { client } = useApi();
  const { state, setCompleted } = useOnboarding();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const finishOnboarding = useCallback(async () => {
    setCompleting(true);
    try {
      await authApi.completeOnboarding(client, {
        name: state.name,
        email: state.email || undefined,
      });
      setCompleted(true);
      router.replace('/');
    } catch {
      setCompleting(false);
    }
  }, [client, state.name, state.email, setCompleted, router]);

  if (step === 0) {
    return <CarouselScreen onComplete={() => setStep(1)} />;
  }
  if (step === 1) {
    return (
      <MobileNumberScreen onNext={() => setStep(2)} onBack={() => setStep(0)} />
    );
  }
  if (step === 2) {
    return <OtpScreen onNext={() => setStep(3)} onBack={() => setStep(1)} />;
  }
  if (step === 3) {
    return <NameScreen onNext={() => setStep(4)} onBack={() => setStep(2)} />;
  }
  if (step === 4) {
    return <EmailScreen onNext={() => setStep(5)} onBack={() => setStep(3)} />;
  }
  return (
    <PreferencesScreen
      onBack={() => setStep(4)}
      onFinish={finishOnboarding}
      submitting={completing}
    />
  );
}
