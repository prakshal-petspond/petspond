import type { VetPendingClinicInvite } from '@petspond/types';

export function isValidClinicInvite(value: unknown): value is VetPendingClinicInvite {
  if (!value || typeof value !== 'object') return false;
  const invite = value as VetPendingClinicInvite;
  return typeof invite.clinicId === 'string' && invite.clinicId.length > 0;
}

export function clinicInviteLabel(invite: VetPendingClinicInvite): string {
  return invite.clinicName?.trim() || 'Your clinic';
}
