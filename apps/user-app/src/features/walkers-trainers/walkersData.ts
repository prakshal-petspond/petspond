const U = 'https://images.unsplash.com';

export type WalkerRole = 'walking' | 'training' | 'both';

export interface WalkerProfessional {
  id: string;
  name: string;
  title: string;
  role: WalkerRole;
  image: string;
  rating: number;
  reviewCount: number;
  distance: string;
  yearsExp: number;
  /** Shown as "Available Today" or "Available Tomorrow" */
  availabilityLabel: 'today' | 'tomorrow';
  tags: string[];
  extraTagCount: number;
  ctaLabel: string;
  priceLine: string;
}

export const WALKER_PROFESSIONALS: WalkerProfessional[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    title: 'Professional Dog Walker',
    role: 'walking',
    image: `${U}/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop`,
    rating: 4.9,
    reviewCount: 287,
    distance: '0.5 kms',
    yearsExp: 5,
    availabilityLabel: 'today',
    tags: ['Group Walks', 'Puppy Walks'],
    extraTagCount: 1,
    ctaLabel: 'Book Walk',
    priceLine: '₹300/walk',
  },
  {
    id: '2',
    name: 'David Thompson',
    title: 'Certified Dog Trainer',
    role: 'training',
    image: `${U}/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop`,
    rating: 4.8,
    reviewCount: 156,
    distance: '0.9 kms',
    yearsExp: 8,
    availabilityLabel: 'tomorrow',
    tags: ['Obedience Training', 'Behaviour'],
    extraTagCount: 1,
    ctaLabel: 'Book Training',
    priceLine: '₹800/session',
  },
  {
    id: '3',
    name: 'Emily Johnson',
    title: 'Walker & Trainer',
    role: 'both',
    image: `${U}/photo-1534361960057-19889db9621e?w=200&h=200&fit=crop`,
    rating: 5.0,
    reviewCount: 412,
    distance: '1.1 kms',
    yearsExp: 6,
    availabilityLabel: 'today',
    tags: ['Group Walks', 'Agility'],
    extraTagCount: 1,
    ctaLabel: 'Book Service',
    priceLine: '₹350/walk • ₹750/session',
  },
  {
    id: '4',
    name: 'Michael Roberts',
    title: 'Neighbourhood Dog Walker',
    role: 'walking',
    image: `${U}/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop`,
    rating: 4.7,
    reviewCount: 198,
    distance: '1.4 kms',
    yearsExp: 3,
    availabilityLabel: 'tomorrow',
    tags: ['Solo Walks', 'Senior Dogs'],
    extraTagCount: 1,
    ctaLabel: 'Book Walk',
    priceLine: '₹280/walk',
  },
  {
    id: '5',
    name: 'Priya Nair',
    title: 'Pet Fitness Trainer',
    role: 'training',
    image: `${U}/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop`,
    rating: 4.9,
    reviewCount: 94,
    distance: '1.6 kms',
    yearsExp: 4,
    availabilityLabel: 'today',
    tags: ['Weight Mgmt', 'Recall Training'],
    extraTagCount: 0,
    ctaLabel: 'Book Training',
    priceLine: '₹850/session',
  },
  {
    id: '6',
    name: 'James Park',
    title: 'Walker & Play Specialist',
    role: 'both',
    image: `${U}/photo-1568572933382-74d9bae86783?w=200&h=200&fit=crop`,
    rating: 4.6,
    reviewCount: 221,
    distance: '2.0 kms',
    yearsExp: 7,
    availabilityLabel: 'today',
    tags: ['Park Play', 'Socialisation'],
    extraTagCount: 2,
    ctaLabel: 'Book Service',
    priceLine: '₹320/walk • ₹700/session',
  },
];

export interface WalkerCertification {
  icon: 'medal' | 'shield-checkmark' | 'checkmark-circle';
  label: string;
}

export interface WalkerScheduleRow {
  day: string;
  slots: string[];
}

export interface WalkerServiceItem {
  title: string;
  description: string;
}

export interface WalkerReviewItem {
  name: string;
  stars: number;
  text: string;
}

export interface WalkerProfileDetail {
  heroImage: string;
  /** Long headline under name, e.g. Professional Dog Walker & Trainer */
  headlineTitle: string;
  walkPriceInr: number | null;
  trainingPriceInr: number | null;
  about: string;
  languages: string[];
  certifications: WalkerCertification[];
  weeklySchedule: WalkerScheduleRow[];
  services: WalkerServiceItem[];
  reviews: WalkerReviewItem[];
  gallery: string[];
}

/** Extended profile content for detail screen; merged with list row by `id`. */
export const WALKER_PROFILE_DETAILS: Record<string, WalkerProfileDetail> = {
  '1': {
    heroImage: `${U}/photo-1552053831-71594a27632d?w=800&h=480&fit=crop`,
    headlineTitle: 'Professional Dog Walker & Trainer',
    walkPriceInr: 300,
    trainingPriceInr: 800,
    about:
      "I'm Sarah — I've been walking and training dogs in Vasundhara for over five years. I focus on calm, positive reinforcement and small group walks so every pup gets attention. Whether your dog needs exercise, leash manners, or confidence building, we'll build a routine that fits your schedule.",
    languages: ['English', 'Hindi'],
    certifications: [
      { icon: 'medal', label: 'Certified Trainer' },
      { icon: 'shield-checkmark', label: 'Background Verified' },
      { icon: 'checkmark-circle', label: '500+ Walks' },
    ],
    weeklySchedule: [
      { day: 'Monday', slots: ['6:00 AM - 8:00 AM', '4:00 PM - 7:00 PM'] },
      { day: 'Tuesday', slots: ['6:00 AM - 8:00 AM', '4:00 PM - 7:00 PM'] },
      { day: 'Wednesday', slots: ['6:00 AM - 8:00 AM', '4:00 PM - 7:00 PM'] },
      { day: 'Thursday', slots: ['6:00 AM - 8:00 AM', '4:00 PM - 7:00 PM'] },
      { day: 'Friday', slots: ['6:00 AM - 8:00 AM', '4:00 PM - 7:00 PM'] },
      { day: 'Saturday', slots: ['6:00 AM - 8:00 AM', '4:00 PM - 7:00 PM'] },
      { day: 'Sunday', slots: ['7:00 AM - 10:00 AM'] },
    ],
    services: [
      { title: 'Group walks', description: 'Social walks in safe parks, max 4 dogs per handler.' },
      { title: 'Solo walks', description: 'One-on-one time for shy or reactive dogs.' },
      { title: 'Obedience basics', description: 'Sit, stay, recall, and leash skills at your pace.' },
      { title: 'Puppy intro', description: 'Short sessions to build confidence and routine.' },
    ],
    reviews: [
      { name: 'R. Kapoor', stars: 5, text: 'Sarah is punctual and sends photos every walk. Our indie loves her!' },
      { name: 'Neha V.', stars: 5, text: 'Training sessions helped with pulling on leash within two weeks.' },
    ],
    gallery: [
      `${U}/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop`,
      `${U}/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop`,
      `${U}/photo-1534361960057-19889db9621e?w=400&h=300&fit=crop`,
      `${U}/photo-1517849845537-4d257902454a?w=400&h=300&fit=crop`,
    ],
  },
  '2': {
    heroImage: `${U}/photo-1548199973-03cce0bbc87b?w=800&h=480&fit=crop`,
    headlineTitle: 'Certified Dog Trainer',
    walkPriceInr: null,
    trainingPriceInr: 800,
    about:
      'Behaviour-focused training using reward-based methods. I work with anxious dogs, reactivity, and basic to advanced obedience.',
    languages: ['English', 'Hindi'],
    certifications: [
      { icon: 'medal', label: 'Certified Trainer' },
      { icon: 'shield-checkmark', label: 'Background Verified' },
      { icon: 'checkmark-circle', label: '200+ Sessions' },
    ],
    weeklySchedule: [
      { day: 'Mon - Fri', slots: ['9:00 AM - 12:00 PM', '3:00 PM - 8:00 PM'] },
      { day: 'Saturday', slots: ['10:00 AM - 4:00 PM'] },
      { day: 'Sunday', slots: ['Closed'] },
    ],
    services: [
      { title: 'Obedience', description: 'Structured programmes for commands and focus.' },
      { title: 'Behaviour consult', description: 'Assessment and plan for barking, anxiety, or aggression.' },
    ],
    reviews: [{ name: 'A. Menon', stars: 5, text: 'Patient and clear instructions. Highly recommend.' }],
    gallery: [`${U}/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop`],
  },
  '3': {
    heroImage: `${U}/photo-1534361960057-19889db9621e?w=800&h=480&fit=crop`,
    headlineTitle: 'Professional Dog Walker & Trainer',
    walkPriceInr: 350,
    trainingPriceInr: 750,
    about: 'Full-service walker and trainer — group walks, agility play, and in-home training slots.',
    languages: ['English', 'Hindi'],
    certifications: [
      { icon: 'medal', label: 'Certified Trainer' },
      { icon: 'shield-checkmark', label: 'Background Verified' },
      { icon: 'checkmark-circle', label: '1000+ Bookings' },
    ],
    weeklySchedule: [
      { day: 'Monday', slots: ['7:00 AM - 9:00 AM', '5:00 PM - 8:00 PM'] },
      { day: 'Tuesday', slots: ['7:00 AM - 9:00 AM', '5:00 PM - 8:00 PM'] },
      { day: 'Wednesday', slots: ['7:00 AM - 9:00 AM', '5:00 PM - 8:00 PM'] },
      { day: 'Thursday', slots: ['7:00 AM - 9:00 AM', '5:00 PM - 8:00 PM'] },
      { day: 'Friday', slots: ['7:00 AM - 9:00 AM', '5:00 PM - 8:00 PM'] },
      { day: 'Saturday', slots: ['8:00 AM - 2:00 PM'] },
      { day: 'Sunday', slots: ['9:00 AM - 12:00 PM'] },
    ],
    services: [
      { title: 'Group & solo walks', description: 'Flexible slots morning and evening.' },
      { title: 'Agility play', description: 'Structured play for high-energy breeds.' },
      { title: 'Home training', description: 'Sessions at your place for the whole family.' },
    ],
    reviews: [{ name: 'K. Das', stars: 5, text: 'Emily handles our two dogs on walks and training — seamless.' }],
    gallery: [`${U}/photo-1568572933382-74d9bae86783?w=400&h=300&fit=crop`],
  },
  '4': {
    heroImage: `${U}/photo-1517849845537-4d257902454a?w=800&h=480&fit=crop`,
    headlineTitle: 'Neighbourhood Dog Walker',
    walkPriceInr: 280,
    trainingPriceInr: null,
    about: 'Local walker covering Vasundhara and nearby — gentle pace for seniors and puppies.',
    languages: ['English', 'Hindi'],
    certifications: [
      { icon: 'shield-checkmark', label: 'Background Verified' },
      { icon: 'checkmark-circle', label: '300+ Walks' },
    ],
    weeklySchedule: [
      { day: 'Mon - Sat', slots: ['7:00 AM - 11:00 AM', '4:00 PM - 7:00 PM'] },
      { day: 'Sunday', slots: ['8:00 AM - 11:00 AM'] },
    ],
    services: [{ title: 'Neighbourhood walks', description: 'Short and long routes based on your dog’s energy.' }],
    reviews: [{ name: 'S. Jain', stars: 4, text: 'Reliable and kind with our older lab.' }],
    gallery: [`${U}/photo-1517849845537-4d257902454a?w=400&h=300&fit=crop`],
  },
  '5': {
    heroImage: `${U}/photo-1583511655857-d19b40a7a54e?w=800&h=480&fit=crop`,
    headlineTitle: 'Pet Fitness Trainer',
    walkPriceInr: null,
    trainingPriceInr: 850,
    about: 'Fitness-oriented training: weight management, conditioning, and recall in outdoor settings.',
    languages: ['English', 'Hindi', 'Malayalam'],
    certifications: [
      { icon: 'medal', label: 'Certified Trainer' },
      { icon: 'shield-checkmark', label: 'Background Verified' },
    ],
    weeklySchedule: [
      { day: 'Mon - Fri', slots: ['6:00 AM - 10:00 AM', '4:00 PM - 7:00 PM'] },
      { day: 'Weekend', slots: ['7:00 AM - 12:00 PM'] },
    ],
    services: [
      { title: 'Fitness sessions', description: 'Structured exercise plans for overweight or active dogs.' },
    ],
    reviews: [{ name: 'P. Roy', stars: 5, text: 'Priya helped our beagle slim down safely.' }],
    gallery: [`${U}/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop`],
  },
  '6': {
    heroImage: `${U}/photo-1568572933382-74d9bae86783?w=800&h=480&fit=crop`,
    headlineTitle: 'Walker & Play Specialist',
    walkPriceInr: 320,
    trainingPriceInr: 700,
    about: 'Park play sessions and walks focused on socialisation and enrichment.',
    languages: ['English', 'Hindi'],
    certifications: [
      { icon: 'shield-checkmark', label: 'Background Verified' },
      { icon: 'checkmark-circle', label: '600+ Walks' },
    ],
    weeklySchedule: [
      { day: 'Mon - Sun', slots: ['8:00 AM - 12:00 PM', '3:00 PM - 7:00 PM'] },
    ],
    services: [
      { title: 'Park play', description: 'Supervised group play and walks.' },
      { title: 'Socialisation', description: 'Gradual intro to dogs and new environments.' },
    ],
    reviews: [{ name: 'L. Zhao', stars: 5, text: 'James is great with our reactive pup.' }],
    gallery: [`${U}/photo-1568572933382-74d9bae86783?w=400&h=300&fit=crop`],
  },
};

export type WalkerProfile = WalkerProfessional & WalkerProfileDetail;

export function getWalkerProfile(id: string): WalkerProfile | null {
  const base = WALKER_PROFESSIONALS.find((p) => p.id === id);
  const detail = WALKER_PROFILE_DETAILS[id];
  if (!base || !detail) return null;
  return { ...base, ...detail };
}

/** Minimum price for footer “Starting from” */
export function getWalkerStartingPrice(profile: WalkerProfile): number {
  const prices = [profile.walkPriceInr, profile.trainingPriceInr].filter((n): n is number => n != null);
  return prices.length ? Math.min(...prices) : 0;
}
