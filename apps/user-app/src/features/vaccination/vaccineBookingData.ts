const U = 'https://images.unsplash.com';

export const PLATFORM_FEE_INR = 30;

export interface VaccineCatalogItem {
  id: string;
  name: string;
  subtitle?: string;
  mandatory: boolean;
  priceInr: number;
  durationMins: number;
  validityLabel: string;
}

export const VACCINE_CATALOG: VaccineCatalogItem[] = [
  {
    id: 'rabies',
    name: 'Rabies Vaccine',
    subtitle: 'Mandatory',
    mandatory: true,
    priceInr: 500,
    durationMins: 15,
    validityLabel: '1 year',
  },
  {
    id: 'dhpp',
    name: 'DHPP (5-in-1)',
    mandatory: false,
    priceInr: 600,
    durationMins: 15,
    validityLabel: '1 year',
  },
  {
    id: 'bordetella',
    name: 'Bordetella',
    mandatory: false,
    priceInr: 400,
    durationMins: 15,
    validityLabel: '1 year',
  },
  {
    id: 'lepto',
    name: 'Leptospirosis',
    mandatory: false,
    priceInr: 550,
    durationMins: 15,
    validityLabel: '1 year',
  },
];

export const VACCINE_FLOW_PETS = [
  {
    id: '1',
    name: 'Luna',
    breed: 'Golden Retriever',
    age: '2 years',
    weight: '18 kg',
    image: `${U}/photo-1633722715463-30a3fd3219ce?w=200&h=200&fit=crop`,
  },
  {
    id: '2',
    name: 'Max',
    breed: 'German Shepherd',
    age: '3 years',
    weight: '32 kg',
    image: `${U}/photo-1589941013453-ec89f33b5e87?w=200&h=200&fit=crop`,
  },
  {
    id: '3',
    name: 'Bella',
    breed: 'Labrador',
    age: '4 years',
    weight: '28 kg',
    image: `${U}/photo-1598133894008-61f6fdb8cc3a?w=200&h=200&fit=crop`,
  },
  {
    id: '4',
    name: 'Charlie',
    breed: 'Beagle',
    age: '1 year',
    weight: '11 kg',
    image: `${U}/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop`,
  },
];

export const VACCINE_REMINDERS = [
  'Arrive 15 minutes before the appointment.',
  "Ensure the pet hasn't eaten 2 hours prior.",
  'Bring existing vaccination certificates.',
  'Keep the pet calm and on a leash/carrier.',
];

export const NOTES_PLACEHOLDER =
  'E.g. My pet is nervous around needles, please be gentle...';

/** Starting price shown on clinic vaccination detail footer */
export function getVaccinationStartingPriceInr(): number {
  return Math.min(...VACCINE_CATALOG.map((v) => v.priceInr));
}
