/**
 * Vet CRM Web - Theme tokens (single source of truth).
 * Matches vaccination screen: warm off-white background, orange primary, status colors.
 * Change here to update app-wide; no hardcoded colors in components.
 */
export const theme = {
  colors: {
    primary: '#EA580C',
    primaryHover: '#C2410C',
    primaryMuted: '#FFEDD5',
    background: '#FFFBEF',
    backgroundMuted: '#FEF3C7',
    foreground: '#333333',
    foregroundMuted: '#6B7280',
    border: '#E5E7EB',
    card: '#FFFFFF',
    success: '#059669',
    successMuted: '#D1FAE5',
    warning: '#DC2626',
    warningMuted: '#FFF0E0',
    tag: '#FEF3C7',
    error: '#DC2626',
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
    xl: '1rem',
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
