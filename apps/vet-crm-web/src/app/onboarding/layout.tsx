import React from 'react';
import { Playfair_Display } from 'next/font/google';
import { OnboardingAuthGuard } from '@/features/onboarding/components/OnboardingAuthGuard';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} h-screen overflow-hidden font-sans`}>
      <OnboardingAuthGuard>{children}</OnboardingAuthGuard>
    </div>
  );
}
