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
  { id: '1', label: 'Grooming', icon: 'cut-outline', route: '/groomers' },
  { id: '2', label: 'Walker & Trainer', icon: 'paw-outline', route: '/walkers-trainers' },
  { id: '3', label: 'Find A Vet', icon: 'medkit-outline', route: '/find-vet' },
  { id: '4', label: 'Vaccine', icon: 'medical-outline', route: '/vaccination' },
];

