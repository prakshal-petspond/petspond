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
    myDay: boolean;
    workspace: boolean;
    directory: boolean;
    admin: boolean;
  }
> = {
  admin: { myDay: true, workspace: true, directory: true, admin: true },
  vet: { myDay: true, workspace: true, directory: true, admin: false },
  // Front-office / additional staff — no personal "My Day" board
  front_staff: { myDay: false, workspace: true, directory: true, admin: false },
};
