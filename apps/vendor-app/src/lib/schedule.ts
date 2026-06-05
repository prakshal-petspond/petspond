import type { VendorWeeklyAvailabilityBlock } from '@petspond/types';

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export type DayScheduleRow = {
  enabled: boolean;
  startMinute: number;
  endMinute: number;
};

export const DEFAULT_WEEKLY_SCHEDULE: VendorWeeklyAvailabilityBlock[] = [1, 2, 3, 4, 5, 6].map(
  (day) => ({
    dayOfWeek: day,
    startMinute: 9 * 60,
    endMinute: 18 * 60,
  }),
);

export function formatMinute(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${min.toString().padStart(2, '0')} ${period}`;
}

/** 6:00 AM – 9:30 PM in 30-minute steps */
export function buildTimeOptions(): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = [];
  for (let m = 6 * 60; m <= 21 * 60 + 30; m += 30) {
    options.push({ value: m, label: formatMinute(m) });
  }
  return options;
}

export function blocksToDayRows(blocks: VendorWeeklyAvailabilityBlock[]): DayScheduleRow[] {
  const rows: DayScheduleRow[] = Array.from({ length: 7 }, () => ({
    enabled: false,
    startMinute: 9 * 60,
    endMinute: 18 * 60,
  }));
  for (const b of blocks) {
    if (b.dayOfWeek >= 0 && b.dayOfWeek <= 6) {
      rows[b.dayOfWeek] = {
        enabled: true,
        startMinute: b.startMinute,
        endMinute: b.endMinute,
      };
    }
  }
  return rows;
}

export function dayRowsToBlocks(rows: DayScheduleRow[]): VendorWeeklyAvailabilityBlock[] {
  return rows
    .map((row, dayOfWeek) => ({ dayOfWeek, ...row }))
    .filter((row) => row.enabled && row.endMinute > row.startMinute)
    .map(({ dayOfWeek, startMinute, endMinute }) => ({ dayOfWeek, startMinute, endMinute }));
}

export function formatScheduleSummary(blocks: VendorWeeklyAvailabilityBlock[]): string {
  if (!blocks.length) return 'No slots configured';
  const enabledDays = blocks
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((b) => `${DAY_LABELS[b.dayOfWeek]} ${formatMinute(b.startMinute)}–${formatMinute(b.endMinute)}`);
  return enabledDays.join(' · ');
}
