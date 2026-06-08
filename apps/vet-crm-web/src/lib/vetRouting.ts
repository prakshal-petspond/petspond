import type { Vet, VetPendingClinicInvite } from '@petspond/types';
import { isValidClinicInvite } from './clinicInvite';

export type VetAuthDestination = '/join-clinic' | '/dashboard' | '/onboarding/about-you';

/** Single routing rule for post-login / session restore — must match API pending-invite logic. */
export function getVetPostAuthPath(
  vet: Vet,
  pendingClinicInvite?: VetPendingClinicInvite | null,
): VetAuthDestination {
  if (isValidClinicInvite(pendingClinicInvite)) return '/join-clinic';
  if (vet.onboardingCompleted) return '/dashboard';
  return '/onboarding/about-you';
}
