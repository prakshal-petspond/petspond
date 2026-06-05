export const ONBOARDING_STEPS = [
  {
    id: 1,
    slug: 'about-you',
    href: '/onboarding/about-you',
    title: 'About you',
    subtitle: 'Personal information',
    bullets: ['Name', 'Clinic name', 'Contact details'] as const,
  },
  {
    id: 2,
    slug: 'clinic',
    href: '/onboarding/clinic',
    title: 'Your clinic',
    subtitle: 'Location & schedule',
    bullets: ['Address', 'Working hours', 'Services'] as const,
  },
  {
    id: 3,
    slug: 'practice',
    href: '/onboarding/practice',
    title: 'Practice details',
    subtitle: 'Review & confirm',
    bullets: ['Team members', 'Veterinarians', 'Front office'] as const,
  },
] as const;

export type OnboardingStepSlug = (typeof ONBOARDING_STEPS)[number]['slug'];

export const ONBOARDING_DRAFT_KEY = 'vet-crm-onboarding-draft';

/** Mon → Sun display order; values are `Date.getDay()` (0 = Sun … 6 = Sat). */
export const OPERATING_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const OPERATING_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const ONBOARDING_CLINIC_SERVICES = [
  { id: 'checkup', name: 'General checkup', icon: 'medical' },
  { id: 'vax', name: 'Vaccination', icon: 'bandage' },
  { id: 'dental', name: 'Dental care', icon: 'tooth' },
  { id: 'surgery', name: 'Surgery', icon: 'scalpel' },
  { id: 'grooming', name: 'Grooming', icon: 'cut' },
  { id: 'teleconsult', name: 'Teleconsult', icon: 'video' },
  { id: 'diagnostics', name: 'Diagnostics', icon: 'scan' },
  { id: 'emergency', name: 'Emergency care', icon: 'alert' },
] as const;

export const DEFAULT_OPERATING_DAYS = [1, 2, 3, 4, 5, 6];
export const DEFAULT_OPENING_MINUTE = 9 * 60;
export const DEFAULT_CLOSING_MINUTE = 19 * 60;

export { VET_EXPERTISE_AREAS } from '@petspond/types';

