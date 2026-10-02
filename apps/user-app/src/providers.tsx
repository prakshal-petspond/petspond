import { type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider, ApiProvider, OnboardingProvider } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ApiProvider>
            <OnboardingProvider>{children}</OnboardingProvider>
          </ApiProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
