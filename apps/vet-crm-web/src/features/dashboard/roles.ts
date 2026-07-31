import type { DashboardRole, Vet } from '@petspond/types';

export const DASHBOARD_ROLE_LABEL: Record<DashboardRole, string> = {
  admin: 'Admin',
  vet: 'Veterinarian',
  front_staff: 'Front Staff',
};

/**
 * Derive CRM dashboard role from the authenticated vet session.
 * Front-staff login will map to `front_staff` once staff auth ships;
 * today clinic admins → admin, other vets → vet.
 */
export function getDashboardRole(vet: Vet | null | undefined): DashboardRole {
  if (!vet) return 'vet';
  if (vet.isClinicAdmin) return 'admin';
  return 'vet';
}

/** Which sidebar sections each role can see. */
export const ROLE_NAV_ACCESS: Record<
  DashboardRole,
  {
    workspace: boolean;
    directory: boolean;
    admin: boolean;
  }
> = {
  admin: { workspace: true, directory: true, admin: true },
  vet: { workspace: true, directory: true, admin: false },
  front_staff: { workspace: true, directory: true, admin: false },
};
