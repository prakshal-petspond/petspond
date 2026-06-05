import type { PublicVendorDetail, PublicVendorListItem } from '@petspond/types';
import { FALLBACK_PET_IMG } from '@/features/home/constants';
import type { ServiceListingItem } from '@/features/home/types';
import type {
  WalkerProfessional,
  WalkerProfileDetail,
  WalkerRole,
  WalkerScheduleRow,
} from '@/features/walkers-trainers/walkersData';
import { formatDistanceKm } from '@/lib/geo';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatMinute(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${min.toString().padStart(2, '0')} ${period}`;
}

function vendorRole(v: PublicVendorListItem): WalkerRole {
  const walk = v.serviceTypes.includes('walking');
  const train = v.serviceTypes.includes('training');
  if (walk && train) return 'both';
  if (walk) return 'walking';
  return 'training';
}

export function vendorToServiceCard(v: PublicVendorListItem): ServiceListingItem {
  return {
    id: v.id,
    name: v.businessName,
    rating: v.rating,
    distance:
      v.distanceKm != null ? `${v.distanceKm < 1 ? formatDistanceKm(v.distanceKm) : `${v.distanceKm.toFixed(1)} kms`}` : '—',
    promo: v.promo ?? 'Book now',
    image: v.image ?? v.photoUrl ?? FALLBACK_PET_IMG,
  };
}

export function vendorToWalkerProfessional(v: PublicVendorListItem): WalkerProfessional {
  const role = vendorRole(v);
  return {
    id: v.id,
    name: v.businessName,
    title: v.displayTitle ?? (role === 'walking' ? 'Dog Walker' : role === 'training' ? 'Trainer' : 'Walker & Trainer'),
    role,
    image: v.photoUrl ?? v.image ?? FALLBACK_PET_IMG,
    rating: v.rating,
    reviewCount: v.reviewCount,
    distance: v.distanceKm != null ? formatDistanceKm(v.distanceKm) : '—',
    yearsExp: 1,
    availabilityLabel: 'today',
    tags: v.serviceModes.map((m) => (m === 'doorstep' ? 'Doorstep' : 'On-site')),
    extraTagCount: 0,
    ctaLabel: role === 'training' ? 'Book Training' : role === 'walking' ? 'Book Walk' : 'Book Service',
    priceLine: 'View services',
  };
}

function weeklyToSchedule(blocks: PublicVendorDetail['weeklyAvailability']): WalkerScheduleRow[] {
  const byDay = new Map<number, string[]>();
  for (const b of blocks) {
    const slot = `${formatMinute(b.startMinute)} - ${formatMinute(b.endMinute)}`;
    const list = byDay.get(b.dayOfWeek) ?? [];
    list.push(slot);
    byDay.set(b.dayOfWeek, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, slots]) => ({ day: DAY_NAMES[day] ?? 'Day', slots }));
}

export function vendorDetailToWalkerProfile(
  v: PublicVendorDetail,
  listRow?: WalkerProfessional,
): WalkerProfessional & WalkerProfileDetail & { name: string } {
  const role = listRow?.role ?? vendorRole(v);
  const image = v.photoUrl ?? v.image ?? listRow?.image ?? FALLBACK_PET_IMG;
  return {
    id: v.id,
    name: v.businessName,
    title: v.displayTitle ?? listRow?.title ?? v.businessName,
    role,
    image,
    rating: v.rating,
    reviewCount: v.reviewCount,
    distance: v.distanceKm != null ? formatDistanceKm(v.distanceKm) : (listRow?.distance ?? '—'),
    yearsExp: listRow?.yearsExp ?? 1,
    availabilityLabel: listRow?.availabilityLabel ?? 'today',
    tags: listRow?.tags ?? v.serviceModes.map((m) => (m === 'doorstep' ? 'Doorstep' : 'On-site')),
    extraTagCount: 0,
    ctaLabel: listRow?.ctaLabel ?? 'Book',
    priceLine: listRow?.priceLine ?? '',
    heroImage: image,
    headlineTitle: v.displayTitle ?? v.businessName,
    walkPriceInr: v.serviceTypes.includes('walking') ? 300 : null,
    trainingPriceInr: v.serviceTypes.includes('training') ? 800 : null,
    about: v.bio ?? `Services: ${v.serviceTypes.join(', ')}. Based at ${v.address}.`,
    languages: ['English'],
    certifications: [],
    weeklySchedule: weeklyToSchedule(v.weeklyAvailability),
    services: v.serviceTypes.map((t) => ({
      title: t.charAt(0).toUpperCase() + t.slice(1),
      description:
        t === 'grooming'
          ? `Modes: ${v.serviceModes.join(', ')}`
          : 'Doorstep service in your service area',
    })),
    reviews: [],
    gallery: [image],
  };
}
