/**
 * User App - Theme tokens. Change here for app-wide updates.
 */
export const theme = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    /** Accent for location, pet pill, promo badges, section labels */
    accent: '#FFA81D',
    accentLight: '#fed7aa',
    background: '#ffffff',
    icon_dark: '#333333',
    text_grey: '#676767',
    text_dark_grey: '#333333',
    slate: '#F9F9F9',
    foreground: '#0f172a',
    muted: '#64748b',
    border: '#F5F5F5',
    error: '#dc2626',
    success: '#16a34a',
    cardBg: '#f5f0e8',
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
