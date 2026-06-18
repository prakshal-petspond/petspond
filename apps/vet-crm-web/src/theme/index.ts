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
    /** Multiplier × 4px — matches Tailwind spacing (p-4 = 16px) */
    unit: 'var(--spacing-unit)',
    1: 'calc(var(--spacing-unit) * 1)',
    2: 'calc(var(--spacing-unit) * 2)',
    3: 'calc(var(--spacing-unit) * 3)',
    4: 'calc(var(--spacing-unit) * 4)',
    5: 'calc(var(--spacing-unit) * 5)',
    6: 'calc(var(--spacing-unit) * 6)',
    8: 'calc(var(--spacing-unit) * 8)',
    10: 'calc(var(--spacing-unit) * 10)',
    12: 'calc(var(--spacing-unit) * 12)',
    16: 'calc(var(--spacing-unit) * 16)',
    20: 'calc(var(--spacing-unit) * 20)',
    24: 'calc(var(--spacing-unit) * 24)',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  fontFamily: {
    sans: 'var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif',
    heading: 'var(--font-comfortaa), ui-sans-serif, system-ui, sans-serif',
    comfortaa: 'var(--font-comfortaa), sans-serif',
    dmSans: 'var(--font-dm-sans), sans-serif',
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
