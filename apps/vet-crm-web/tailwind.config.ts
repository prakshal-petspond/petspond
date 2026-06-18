import type { Config } from 'tailwindcss';
import { buildSpacingScale } from './src/theme/spacing';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-muted': 'var(--color-primary-muted)',
        background: 'var(--color-background)',
        'background-muted': 'var(--color-background-muted)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        card: 'var(--color-card)',
        success: 'var(--color-success)',
        'success-muted': 'var(--color-success-muted)',
        warning: 'var(--color-warning)',
        'warning-muted': 'var(--color-warning-muted)',
        tag: 'var(--color-tag)',
        error: 'var(--color-error)',
        'brand-blue': 'var(--color-brand-blue)',
        'brand-blue-hover': 'var(--color-brand-blue-hover)',
        'onboarding-accent': 'var(--color-onboarding-accent)',
        'input-border': 'var(--color-input-border)',
        'step-muted': 'var(--color-step-muted)',
        'sidebar-tip-bg': 'var(--color-sidebar-tip-bg)',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['var(--font-comfortaa)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-comfortaa)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        comfortaa: ['var(--font-comfortaa)', 'sans-serif'],
        'dm-sans': ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      fontSize: {
        '4.5xl': ['2.5rem', { lineHeight: '1.2' }], // 40px
      },
      spacing: buildSpacingScale(),
    },
  },
  plugins: [],
};

export default config;
