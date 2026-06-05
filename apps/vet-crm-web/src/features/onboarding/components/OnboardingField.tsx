import React from 'react';

type OnboardingFieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function OnboardingField({ label, hint, children, className = '' }: OnboardingFieldProps) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-foreground">{label}</label>
      {hint ? <p className="mb-2 text-xs text-muted">{hint}</p> : null}
      {children}
    </div>
  );
}

type OnboardingInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function OnboardingInput({ className = '', ...props }: OnboardingInputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-input-border bg-card px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted/70 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 ${className}`}
    />
  );
}
