import type { Metadata } from 'next';
import '@/theme/css-variables.css';
import './globals.css';
import { Providers } from './providers';
import { comfortaa, dmSans } from '@/theme/fonts';

export const metadata: Metadata = {
  title: 'Petspond Vet CRM',
  description: 'Veterinary practice management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${comfortaa.variable}`}>
      <body
        className={`${dmSans.className} font-sans antialiased min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
