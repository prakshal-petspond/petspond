import React from 'react';

type OnboardingSectionCardProps = {
  icon: React.ReactNode;
  iconBg: 'orange' | 'blue';
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function OnboardingSectionCard({
  icon,
  iconBg,
  title,
  subtitle,
  children,
}: OnboardingSectionCardProps) {
  const iconWrapClass =
    iconBg === 'orange'
      ? 'bg-onboarding-accent text-white'
      : 'bg-brand-blue text-white';

  return (
    <section className="rounded-2xl border border-input-border/50 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrapClass}`}
        >
          {icon}
        </span>
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
