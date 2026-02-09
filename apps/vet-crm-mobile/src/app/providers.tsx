import { type ReactNode } from 'react';
import { ThemeProvider, ApiProvider } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ApiProvider>{children}</ApiProvider>
    </ThemeProvider>
  );
}
