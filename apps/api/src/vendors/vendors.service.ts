import { Injectable, NotFoundException } from '@nestjs/common';
import type { Vendor as VendorRow } from '@prisma/client';
import type {
  PublicVendorDetail,
  PublicVendorListItem,
  Vendor,
  VendorCompleteOnboardingDto,
  VendorServiceType,
  VendorUpdateProfileDto,
  VendorWeeklyAvailabilityBlock,
} from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';
import { haversineKm } from './vendors.geo';

function toVendor(row: VendorRow): Vendor {
  const weeklyAvailability =
    (row.weeklyAvailability as VendorWeeklyAvailabilityBlock[] | null) ?? [];
  return {
    id: row.id,
    mobile: row.mobile,
    businessName: row.businessName,
    displayTitle: row.displayTitle ?? undefined,
    bio: row.bio ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    serviceTypes: (row.serviceTypes ?? []) as Vendor['serviceTypes'],
    serviceModes: (row.serviceModes ?? []) as Vendor['serviceModes'],
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    city: row.city ?? undefined,
    serviceRadiusKm: row.serviceRadiusKm,
    weeklyAvailability,
    rating: row.rating,
    reviewCount: row.reviewCount,
    promo: row.promo ?? undefined,
    onboardingCompleted: row.onboardingCompleted,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toListItem(row: VendorRow, distanceKm?: number): PublicVendorListItem {
  return {
    id: row.id,
    businessName: row.businessName,
    displayTitle: row.displayTitle ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    serviceTypes: (row.serviceTypes ?? []) as PublicVendorListItem['serviceTypes'],
    serviceModes: (row.serviceModes ?? []) as PublicVendorListItem['serviceModes'],
    rating: row.rating,
    reviewCount: row.reviewCount,
    promo: row.promo ?? undefined,
    image: row.photoUrl ?? undefined,
    distanceKm,
  };
}

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrFindByMobile(mobile: string): Promise<Vendor> {
    let row = await this.prisma.vendor.findUnique({ where: { mobile } });
    if (!row) {
      row = await this.prisma.vendor.create({ data: { mobile } });
    }
    return toVendor(row);
  }

  async findById(id: string): Promise<Vendor | null> {
    const row = await this.prisma.vendor.findUnique({ where: { id } });
    return row ? toVendor(row) : null;
  }

  async completeOnboarding(vendorId: string, dto: VendorCompleteOnboardingDto): Promise<Vendor> {
    const serviceModes = normalizeServiceModes(dto.serviceTypes, dto.serviceModes);
    try {
      const row = await this.prisma.vendor.update({
        where: { id: vendorId },
        data: {
          businessName: dto.businessName,
          displayTitle: dto.displayTitle,
          bio: dto.bio,
          photoUrl: dto.photoUrl,
          serviceTypes: dto.serviceTypes,
          serviceModes,
          latitude: dto.latitude,
          longitude: dto.longitude,
          address: dto.address,
          city: dto.city,
          serviceRadiusKm: dto.serviceRadiusKm,
          weeklyAvailability: dto.weeklyAvailability as unknown as import('@prisma/client').Prisma.InputJsonValue,
          promo: dto.promo,
          onboardingCompleted: true,
          isActive: true,
        },
      });
      return toVendor(row);
    } catch {
      throw new NotFoundException('Vendor not found');
    }
  }

  async updateProfile(vendorId: string, dto: VendorUpdateProfileDto): Promise<Vendor> {
    const existing = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!existing) throw new NotFoundException('Vendor not found');
    const serviceTypes = (dto.serviceTypes ?? existing.serviceTypes) as VendorServiceType[];
    const serviceModes = dto.serviceModes
      ? normalizeServiceModes(serviceTypes, dto.serviceModes)
      : ((existing.serviceModes ?? []) as VendorCompleteOnboardingDto['serviceModes']);
    try {
      const row = await this.prisma.vendor.update({
        where: { id: vendorId },
        data: {
          ...(dto.businessName != null && { businessName: dto.businessName }),
          ...(dto.displayTitle != null && { displayTitle: dto.displayTitle }),
          ...(dto.bio != null && { bio: dto.bio }),
          ...(dto.photoUrl != null && { photoUrl: dto.photoUrl }),
          ...(dto.serviceTypes != null && { serviceTypes: dto.serviceTypes }),
          serviceModes,
          ...(dto.latitude != null && { latitude: dto.latitude }),
          ...(dto.longitude != null && { longitude: dto.longitude }),
          ...(dto.address != null && { address: dto.address }),
          ...(dto.city != null && { city: dto.city }),
          ...(dto.serviceRadiusKm != null && { serviceRadiusKm: dto.serviceRadiusKm }),
          ...(dto.weeklyAvailability != null && {
            weeklyAvailability: dto.weeklyAvailability as unknown as import('@prisma/client').Prisma.InputJsonValue,
          }),
          ...(dto.promo != null && { promo: dto.promo }),
          ...(dto.isActive != null && { isActive: dto.isActive }),
        },
      });
      return toVendor(row);
    } catch {
      throw new NotFoundException('Vendor not found');
    }
  }

  async listPublic(params: {
    type?: VendorServiceType;
    lat?: number;
    lng?: number;
    q?: string;
  }): Promise<PublicVendorListItem[]> {
    const rows = await this.prisma.vendor.findMany({
      where: {
        onboardingCompleted: true,
        isActive: true,
        ...(params.type ? { serviceTypes: { has: params.type } } : {}),
      },
      orderBy: { rating: 'desc' },
    });
    const q = params.q?.trim().toLowerCase();

    let items = rows.map((row) => {
      let distanceKm: number | undefined;
      if (params.lat != null && params.lng != null && row.latitude && row.longitude) {
        distanceKm = haversineKm(
          { latitude: params.lat, longitude: params.lng },
          { latitude: row.latitude, longitude: row.longitude },
        );
      }
      return { row, distanceKm };
    });

    if (params.lat != null && params.lng != null) {
      items = items.filter(
        ({ row, distanceKm }) =>
          distanceKm != null && distanceKm <= (row.serviceRadiusKm || 10),
      );
    }

    if (q) {
      items = items.filter(({ row }) => {
        const hay = `${row.businessName} ${row.displayTitle ?? ''} ${row.city ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    items.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    return items.map(({ row, distanceKm }) => toListItem(row, distanceKm));
  }

  async getPublicDetail(id: string, lat?: number, lng?: number): Promise<PublicVendorDetail | null> {
    const row = await this.prisma.vendor.findUnique({ where: { id } });
    if (!row || !row.onboardingCompleted || !row.isActive) return null;

    let distanceKm: number | undefined;
    if (lat != null && lng != null && row.latitude && row.longitude) {
      distanceKm = haversineKm(
        { latitude: lat, longitude: lng },
        { latitude: row.latitude, longitude: row.longitude },
      );
      if (distanceKm > (row.serviceRadiusKm || 10)) return null;
    }

    const weeklyAvailability =
      (row.weeklyAvailability as VendorWeeklyAvailabilityBlock[] | null) ?? [];
    const base = toListItem(row, distanceKm);
    return {
      ...base,
      bio: row.bio ?? undefined,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      serviceRadiusKm: row.serviceRadiusKm,
      weeklyAvailability,
    };
  }
}

function normalizeServiceModes(
  serviceTypes: VendorServiceType[],
  modes: VendorCompleteOnboardingDto['serviceModes'],
): VendorCompleteOnboardingDto['serviceModes'] {
  const hasGrooming = serviceTypes.includes('grooming');
  const hasWalkTrain =
    serviceTypes.includes('walking') || serviceTypes.includes('training');
  if (hasGrooming && !hasWalkTrain) {
    return modes.filter((m) => m === 'on_site' || m === 'doorstep');
  }
  if (hasWalkTrain && !hasGrooming) {
    return ['doorstep'];
  }
  if (hasGrooming && hasWalkTrain) {
    const groomModes = modes.filter((m) => m === 'on_site' || m === 'doorstep');
    return groomModes.includes('doorstep') ? groomModes : [...groomModes, 'doorstep'];
  }
  return modes;
}
