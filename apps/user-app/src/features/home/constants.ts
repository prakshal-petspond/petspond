import { Dimensions } from 'react-native';
import type { HomeCategory, ServiceListingItem } from './types';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const H_PAD = 16;
export const CARD_GAP = 12;
export const CATEGORY_SIZE = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP * 3) / 4;
export const SERVICE_CARD_WIDTH = SCREEN_WIDTH * 0.45;

export const FALLBACK_PET_IMG =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop';

export const PROMO_BANNER = {
  title: 'PAWS & WHISKERS VET CLINIC',
  subtitle: 'COMPASSIONATE CARE FOR YOUR PETS',
  contact: 'OPEN | 555-0123 | www.pwvetclinic.com',
};

export const REMINDER_CTA = 'Book now';

export const CATEGORIES: HomeCategory[] = [
  { id: '1', label: 'Grooming', icon: 'cut-outline' },
  { id: '2', label: 'Walker & Trainer', icon: 'paw-outline', route: '/walkers-trainers' },
  { id: '3', label: 'Find A Vet', icon: 'medkit-outline', route: '/find-vet' },
  { id: '4', label: 'Vaccine', icon: 'medical-outline', route: '/vaccination' },
];

const SERVICE_IMAGE =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=240&fit=crop';

export const WALKERS: ServiceListingItem[] = [
  {
    id: '1',
    name: 'Happy paws studio',
    rating: 4.7,
    distance: '1.2 kms',
    promo: '50% Off on your first booking',
    image: SERVICE_IMAGE,
  },
  {
    id: '2',
    name: 'Pawfect walks',
    rating: 4.9,
    distance: '2.1 kms',
    promo: 'First walk free',
    image: SERVICE_IMAGE,
  },
  {
    id: '3',
    name: 'Tail wagers',
    rating: 4.5,
    distance: '0.8 kms',
    promo: '20% Off',
    image: SERVICE_IMAGE,
  },
];

export const GROOMERS: ServiceListingItem[] = [
  {
    id: '1',
    name: 'Happy paws studio',
    rating: 4.7,
    distance: '1.2 kms',
    promo: '50% Off on your first booking',
    image: SERVICE_IMAGE,
  },
  {
    id: '2',
    name: 'Fluffy & clean',
    rating: 4.8,
    distance: '1.5 kms',
    promo: 'Free nail trim',
    image: SERVICE_IMAGE,
  },
];
