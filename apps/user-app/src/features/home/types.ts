import type { Ionicons } from '@expo/vector-icons';

export type HomeCategory = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: '/walkers-trainers' | '/groomers' | '/find-vet' | '/vaccination';
};

export type ServiceListingItem = {
  id: string;
  name: string;
  rating: number;
  distance: string;
  promo: string;
  image: string;
};

export type PetPillLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Ref target for the pet pill anchor used by the selector modal positioning. */
export type PetPillAnchorRef = {
  measureInWindow: (cb: (x: number, y: number, width: number, height: number) => void) => void;
};
