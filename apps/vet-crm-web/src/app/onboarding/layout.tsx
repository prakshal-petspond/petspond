import React from 'react';
import { OnboardingAuthGuard } from '@/features/onboarding/components/OnboardingAuthGuard';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden font-sans">
      <OnboardingAuthGuard>{children}</OnboardingAuthGuard>
    </div>
  );
}
