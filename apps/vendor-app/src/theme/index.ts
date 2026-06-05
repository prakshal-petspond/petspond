/**
 * Vendor App - Theme tokens (aligned with user app).
 */
export const theme = {
  colors: {
    primary_bg: '#FFE6BB',
    accent: '#FC6E2A',
    primary: '#FFA81D',
    text_secondary: '#676767',
    grey_bg: '#F3F3F3',
    info_blue: '#1F8FFF',
    text_primary: '#333333',
    icon_brown: '#9B5100',
    solid_white: '#FFFFFF',
    secondary_bg: '#FFF9EE',
    success: '#4CAF50',
    success_alpha: '#E8F5E9',
    info_blue_alpha: '#2196F333',
    icon_mustard: '#FF9800',
    info_purple: '#9C27B0',
    purple_bg: '#9C27B033',
    primary_light: '#FFA81D33',
    inactive_bg_alpha: '#E0E0E0',
    inactive_bg: '#999999',
    matte_red: '#E16868',
    warning: '#FD4A4A',
    orange: '#FF5722',
    orange_alpha: '#FF572233',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
  borderRadius: { sm: 4, md: 8, lg: 12, full: 9999 },
  fontSize: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24 },
} as const;

export type Theme = typeof theme;
