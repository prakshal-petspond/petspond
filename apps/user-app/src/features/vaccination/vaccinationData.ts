const U = 'https://images.unsplash.com';

/** Pets shown on the vaccination screen (aligned with home pets by id). */
export const VACCINATION_PETS = [
  {
    id: '1',
    name: 'Luna',
    breed: 'Golden Retriever',
    image: `${U}/photo-1633722715463-30a3fd3219ce?w=200&h=200&fit=crop`,
  },
  {
    id: '2',
    name: 'Max',
    breed: 'German Shepherd',
    image: `${U}/photo-1589941013453-ec89f33b5e87?w=200&h=200&fit=crop`,
  },
  {
    id: '3',
    name: 'Bella',
    breed: 'Labrador',
    image: `${U}/photo-1598133894008-61f6fdb8cc3a?w=200&h=200&fit=crop`,
  },
];

export interface VaccinationClinic {
  vetId: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  distance: string;
  slotsLabel: string;
  vaccines: string[];
  extraCount: number;
  price: number;
}

export const VACCINATION_CLINICS: VaccinationClinic[] = [
  {
    vetId: '1',
    name: 'PetCare Veterinary Clinic',
    image: `${U}/photo-1612349317150-e413f6d5a925?w=200&h=200&fit=crop`,
    rating: 4.9,
    reviewCount: 324,
    distance: '0.8 kms',
    slotsLabel: 'Today at 3:00 PM, 5:00 PM',
    vaccines: ['Rabies', 'DHPP', 'Bordetella'],
    extraCount: 1,
    price: 500,
  },
  {
    vetId: '2',
    name: 'Advanced Pet Hospital',
    image: `${U}/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop`,
    rating: 4.8,
    reviewCount: 512,
    distance: '1.2 kms',
    slotsLabel: 'Tomorrow at 10:00 AM, 2:00 PM',
    vaccines: ['Rabies', 'DHPP', 'Leptospirosis'],
    extraCount: 1,
    price: 550,
  },
  {
    vetId: '3',
    name: 'Happy Tails Veterinary Center',
    image: `${U}/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop`,
    rating: 4.7,
    reviewCount: 289,
    distance: '1.8 kms',
    slotsLabel: 'Today at 4:00 PM, 6:00 PM',
    vaccines: ['Rabies', 'DHPP', 'Bordetella'],
    extraCount: 1,
    price: 520,
  },
];
