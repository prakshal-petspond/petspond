/** Bookable morning slots (9:00–17:30) for consultation / vaccination flows */
export const TIME_SLOT_DEFS: { label: string; hour: number; minute: number }[] = (() => {
  const out: { label: string; hour: number; minute: number }[] = [];
  for (let h = 9; h <= 17; h++) {
    for (const m of [0, 30]) {
      if (h === 17 && m > 0) break;
      const d = new Date(2000, 0, 1, h, m, 0, 0);
      out.push({
        label: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }),
        hour: h,
        minute: m,
      });
    }
  }
  return out;
})();

export function scheduledAtFromDateAndSlot(date: Date, slot: { hour: number; minute: number }): string {
  const x = new Date(date);
  x.setHours(slot.hour, slot.minute, 0, 0);
  return x.toISOString();
}
