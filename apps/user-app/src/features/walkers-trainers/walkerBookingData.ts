const U = 'https://images.unsplash.com';

export const WALKER_BOOKING_PLATFORM_FEE_INR = 20;

export interface WalkerBookingPet {
  id: string;
  name: string;
  breed: string;
  image: string;
}

export const WALKER_BOOKING_PETS: WalkerBookingPet[] = [
  { id: 'p1', name: 'Loki', breed: 'Golden Retriever', image: `${U}/photo-1633722715463-30a3fd3219ce?w=200&h=200&fit=crop` },
  { id: 'p2', name: 'Milo', breed: 'Labrador', image: `${U}/photo-1598133894008-61f6fdb8cc3a?w=200&h=200&fit=crop` },
  { id: 'p3', name: 'Bella', breed: 'Beagle', image: `${U}/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop` },
  { id: 'p4', name: 'Charlie', breed: 'Pug', image: `${U}/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop` },
];

export interface WalkerServiceOption {
  id: string;
  label: string;
  priceInr: number;
}

export const WALKER_SERVICES_WALKING: WalkerServiceOption[] = [
  { id: 'w30', label: 'Individual Walk (30 min)', priceInr: 300 },
  { id: 'w60', label: 'Individual Walk (60 min)', priceInr: 500 },
  { id: 'wg30', label: 'Group Walk (30 min)', priceInr: 200 },
];

export const WALKER_SERVICES_TRAINING: WalkerServiceOption[] = [
  { id: 't45', label: 'Training session (45 min)', priceInr: 800 },
  { id: 't60', label: 'Training session (60 min)', priceInr: 1000 },
  { id: 'tpup', label: 'Puppy basics package', priceInr: 2400 },
];

export const WALKER_SERVICES_GROOMING: WalkerServiceOption[] = [
  { id: 'gbasic', label: 'Basic bath & brush', priceInr: 600 },
  { id: 'gfull', label: 'Full groom', priceInr: 1200 },
  { id: 'gnail', label: 'Nail trim only', priceInr: 200 },
];

export type WalkerServiceCategory = 'walking' | 'training' | 'grooming';

export function servicesForCategory(cat: WalkerServiceCategory): WalkerServiceOption[] {
  switch (cat) {
    case 'walking':
      return WALKER_SERVICES_WALKING;
    case 'training':
      return WALKER_SERVICES_TRAINING;
    case 'grooming':
      return WALKER_SERVICES_GROOMING;
  }
}

export interface SavedServiceAddress {
  id: string;
  label: string;
  line1: string;
  line2: string;
}

export const WALKER_DEFAULT_ADDRESSES: SavedServiceAddress[] = [
  { id: 'a1', label: 'Home', line1: '123 Park Avenue', line2: 'Koramangala, Bangalore' },
  { id: 'a2', label: 'Office', line1: '42 Tech Park', line2: 'Electronic City, Bangalore' },
  { id: 'a3', label: "Parent's House", line1: '7 Rose Lane', line2: 'Indiranagar, Bangalore' },
];

/** Time grid matching reference (morning + evening). */
export const WALKER_TIME_SLOTS = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
];
