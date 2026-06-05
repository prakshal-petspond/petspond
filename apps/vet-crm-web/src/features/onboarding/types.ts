import type { VetWeeklyAvailabilityBlock } from '@petspond/types';
import {
  DEFAULT_CLOSING_MINUTE,
  DEFAULT_OPENING_MINUTE,
  ONBOARDING_CLINIC_SERVICES,
} from './constants';

export type OnboardingDraft = {
  fullName: string;
  clinicName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string;
  operatingDays: number[];
  openingMinute: number;
  closingMinute: number;
  customizeSchedule: boolean;
  weeklyAvailability: VetWeeklyAvailabilityBlock[];
  selectedServices: string[];
  additionalVeterinarians: OnboardingTeamVetDraft[];
  frontOfficeStaff: OnboardingFrontStaffDraft[];
};

export type OnboardingTeamVetDraft = {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  veterinaryRegistrationNumber: string;
  specializations: string[];
};

export type OnboardingFrontStaffDraft = {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
};

export const EMPTY_TEAM_VET: Omit<OnboardingTeamVetDraft, 'id'> = {
  fullName: '',
  email: '',
  mobile: '',
  veterinaryRegistrationNumber: '',
  specializations: [],
};

export const EMPTY_FRONT_STAFF: Omit<OnboardingFrontStaffDraft, 'id'> = {
  fullName: '',
  email: '',
  mobile: '',
};

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  fullName: '',
  clinicName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  latitude: null,
  longitude: null,
  placeId: '',
  operatingDays: [1, 2, 3, 4, 5, 6],
  openingMinute: DEFAULT_OPENING_MINUTE,
  closingMinute: DEFAULT_CLOSING_MINUTE,
  customizeSchedule: false,
  weeklyAvailability: [],
  selectedServices: ['checkup', 'vax', 'dental'],
  additionalVeterinarians: [],
  frontOfficeStaff: [],
};

export function formatMinuteLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const mm = minute % 60;
  const d = new Date(2000, 0, 1, h, mm, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function buildStandardWeeklyBlocks(
  operatingDays: number[],
  openingMinute: number,
  closingMinute: number,
): VetWeeklyAvailabilityBlock[] {
  return operatingDays.map((dayOfWeek) => ({
    dayOfWeek,
    startMinute: openingMinute,
    endMinute: closingMinute,
  }));
}

export function operatingDaysSummary(days: number[]): string {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const sorted = [...days].sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.indexOf(a) - order.indexOf(b);
  });
  return sorted.map((d) => labels[d]).join(', ');
}

export function selectedServiceItems(ids: string[]) {
  return ONBOARDING_CLINIC_SERVICES.filter((s) => ids.includes(s.id)).map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
  }));
}

export function isStep1Complete(draft: OnboardingDraft): boolean {
  return Boolean(
    draft.fullName.trim() &&
      draft.clinicName.trim() &&
      draft.phone.replace(/\D/g, ''),
  );
}

export function isStep2Complete(draft: OnboardingDraft): boolean {
  return Boolean(
    draft.address.trim() &&
      (draft.pincode.trim() || draft.latitude != null) &&
      draft.operatingDays.length > 0 &&
      draft.selectedServices.length > 0,
  );
}
