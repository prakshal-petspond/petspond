/**
 * User App - Theme tokens. Change here for app-wide updates.
 */
export const theme = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    error: '#dc2626',
    success: '#16a34a',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
  },
} as const;

export type Theme = typeof theme;
