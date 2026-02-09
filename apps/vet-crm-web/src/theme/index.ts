/**
 * Vet CRM Web - Theme tokens.
 * Central place for colors, spacing, typography. Change here to update app-wide.
 */
export const theme = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryMuted: '#dbeafe',
    background: '#ffffff',
    backgroundMuted: '#f8fafc',
    foreground: '#0f172a',
    foregroundMuted: '#64748b',
    border: '#e2e8f0',
    error: '#dc2626',
    success: '#16a34a',
    warning: '#d97706',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  fontFamily: {
    sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
    mono: 'var(--font-geist-mono), ui-monospace, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
} as const;

export type Theme = typeof theme;
