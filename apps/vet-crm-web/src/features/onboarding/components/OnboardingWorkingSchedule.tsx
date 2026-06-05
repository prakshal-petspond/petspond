'use client';

import React, { useMemo } from 'react';
import type { VetWeeklyAvailabilityBlock } from '@petspond/types';
import { WeeklyScheduleCalendar } from '@/components/WeeklyScheduleCalendar';
import { OPERATING_DAY_LABELS, OPERATING_DAY_ORDER } from '../constants';
import { formatMinuteLabel, operatingDaysSummary } from '../types';
import { buildTimeOptions } from '../lib/timeOptions';
import { OnboardingSectionCard } from './OnboardingSectionCard';

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type OnboardingWorkingScheduleProps = {
  operatingDays: number[];
  openingMinute: number;
  closingMinute: number;
  customizeSchedule: boolean;
  weeklyAvailability: VetWeeklyAvailabilityBlock[];
  onChange: (patch: {
    operatingDays?: number[];
    openingMinute?: number;
    closingMinute?: number;
    customizeSchedule?: boolean;
    weeklyAvailability?: VetWeeklyAvailabilityBlock[];
  }) => void;
};

export function OnboardingWorkingSchedule({
  operatingDays,
  openingMinute,
  closingMinute,
  customizeSchedule,
  weeklyAvailability,
  onChange,
}: OnboardingWorkingScheduleProps) {
  const timeOptions = useMemo(() => buildTimeOptions(), []);

  const toggleDay = (dow: number) => {
    const next = operatingDays.includes(dow)
      ? operatingDays.filter((d) => d !== dow)
      : [...operatingDays, dow];
    onChange({ operatingDays: next });
  };

  return (
    <OnboardingSectionCard icon={<ClockIcon />} iconBg="blue" title="Working Schedule">
      <p className="mb-3 text-sm font-semibold text-foreground">Operating days</p>
      <div className="flex flex-wrap gap-2">
        {OPERATING_DAY_ORDER.map((dow, i) => {
          const selected = operatingDays.includes(dow);
          return (
            <button
              key={dow}
              type="button"
              onClick={() => toggleDay(dow)}
              className={`min-w-[3rem] rounded-xl px-3 py-2 text-sm font-semibold transition ${
                selected
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'border border-input-border bg-card text-muted hover:text-foreground'
              }`}
            >
              {OPERATING_DAY_LABELS[i]}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        Selected: {operatingDays.length ? operatingDaysSummary(operatingDays) : 'None'}
      </p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-input-border/40 pt-5">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-wider text-muted uppercase">
              Opening
            </p>
            <select
              value={openingMinute}
              onChange={(e) => {
                const v = Number(e.target.value);
                onChange({
                  openingMinute: v,
                  closingMinute: closingMinute <= v ? v + 60 : closingMinute,
                });
              }}
              className="rounded-xl border border-input-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-brand-blue"
            >
              {timeOptions
                .filter((o) => o.minute < closingMinute)
                .map((o) => (
                  <option key={o.minute} value={o.minute}>
                    {o.label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-wider text-muted uppercase">
              Closing
            </p>
            <select
              value={closingMinute}
              onChange={(e) => onChange({ closingMinute: Number(e.target.value) })}
              className="rounded-xl border border-input-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-brand-blue"
            >
              {timeOptions
                .filter((o) => o.minute > openingMinute)
                .map((o) => (
                  <option key={o.minute} value={o.minute}>
                    {o.label}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ customizeSchedule: !customizeSchedule })}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
        >
          {customizeSchedule ? 'Hide customize' : 'Customize'}
          <span aria-hidden>{customizeSchedule ? '↑' : '→'}</span>
        </button>
      </div>

      {!customizeSchedule ? (
        <p className="mt-4 text-xs text-muted">
          Standard hours: {formatMinuteLabel(openingMinute)} – {formatMinuteLabel(closingMinute)} on
          selected days.
        </p>
      ) : (
        <div className="mt-5">
          <WeeklyScheduleCalendar
            blocks={weeklyAvailability}
            onChange={(blocks) => onChange({ weeklyAvailability: blocks })}
          />
        </div>
      )}
    </OnboardingSectionCard>
  );
}
