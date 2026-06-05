export function buildTimeOptions(startHour = 6, endHour = 23, stepMinutes = 30) {
  const out: { minute: number; label: string }[] = [];
  for (let m = startHour * 60; m <= endHour * 60; m += stepMinutes) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const d = new Date(2000, 0, 1, h, mm, 0, 0);
    out.push({
      minute: m,
      label: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }),
    });
  }
  return out;
}
