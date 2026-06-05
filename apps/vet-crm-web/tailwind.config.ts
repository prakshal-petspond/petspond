import type { Config } from 'tailwindcss';

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
        serif: ['var(--font-playfair)', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
    },
  },
  plugins: [],
};

export default config;
