import { type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider, ApiProvider, OnboardingProvider, LocationProvider } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ApiProvider>
            <LocationProvider>
              <OnboardingProvider>{children}</OnboardingProvider>
            </LocationProvider>
          </ApiProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
