import type { ConsultationBooking } from '@petspond/types';

export const AVATAR_COLORS = [
  'bg-avatar-1-bg text-avatar-1-fg',
  'bg-avatar-2-bg text-avatar-2-fg',
  'bg-avatar-3-bg text-avatar-3-fg',
  'bg-avatar-4-bg text-avatar-4-fg',
  'bg-avatar-5-bg text-avatar-5-fg',
  'bg-avatar-6-bg text-avatar-6-fg',
];

export function petInitials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash]!;
}

export function formatMoney(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function formatDashboardDate(d = new Date()) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ownerLabel(booking: ConsultationBooking): string {
  return booking.userName ?? booking.ownerNameSnapshot ?? 'Owner';
}

export function serviceLabel(booking: ConsultationBooking): string {
  return booking.reasonIds?.[0]?.replace(/-/g, ' ') ?? 'Consultation';
}

export function scheduledRelativeHint(scheduledAt: string): { label: string; tone: 'late' | 'now' | 'soon' | 'muted' } {
  const diffMin = Math.round((Date.now() - new Date(scheduledAt).getTime()) / 60000);
  if (diffMin > 5) return { label: `${diffMin}m ago`, tone: 'late' };
  if (diffMin >= -2 && diffMin <= 5) return { label: 'Now', tone: 'now' };
  if (diffMin < -2 && diffMin >= -30) return { label: `In ${Math.abs(diffMin)}m`, tone: 'soon' };
  return { label: 'Later', tone: 'muted' };
}

export function waitMinutesSince(iso?: string): number {
  if (!iso) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}
