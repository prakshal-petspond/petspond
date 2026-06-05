import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  PublicVendorDetail,
  PublicVendorListItem,
  Vendor,
  VendorCompleteOnboardingDto,
  VendorServiceType,
  VendorUpdateProfileDto,
} from '@petspond/types';
import { VendorDocument } from './vendor.schema';
import { haversineKm } from './vendors.geo';

function toVendor(doc: VendorDocument): Vendor {
  return {
    id: String(doc._id),
    mobile: doc.mobile,
    businessName: doc.businessName,
    displayTitle: doc.displayTitle,
    bio: doc.bio,
    photoUrl: doc.photoUrl,
    serviceTypes: doc.serviceTypes ?? [],
    serviceModes: doc.serviceModes ?? [],
    latitude: doc.latitude,
    longitude: doc.longitude,
    address: doc.address,
    city: doc.city,
    serviceRadiusKm: doc.serviceRadiusKm,
    weeklyAvailability: doc.weeklyAvailability ?? [],
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    promo: doc.promo,
    onboardingCompleted: doc.onboardingCompleted,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toListItem(doc: VendorDocument, distanceKm?: number): PublicVendorListItem {
  return {
    id: String(doc._id),
    businessName: doc.businessName,
    displayTitle: doc.displayTitle,
    photoUrl: doc.photoUrl,
    serviceTypes: doc.serviceTypes ?? [],
    serviceModes: doc.serviceModes ?? [],
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    promo: doc.promo,
    image: doc.photoUrl,
    distanceKm,
  };
}

@Injectable()
export class VendorsService {
  constructor(@InjectModel(VendorDocument.name) private readonly model: Model<VendorDocument>) {}

  async createOrFindByMobile(mobile: string): Promise<Vendor> {
    let doc = await this.model.findOne({ mobile });
    if (!doc) {
      doc = await this.model.create({ mobile });
    }
    return toVendor(doc);
  }

  async findById(id: string): Promise<Vendor | null> {
    const doc = await this.model.findById(id);
    return doc ? toVendor(doc) : null;
  }

  async completeOnboarding(vendorId: string, dto: VendorCompleteOnboardingDto): Promise<Vendor> {
    const serviceModes = normalizeServiceModes(dto.serviceTypes, dto.serviceModes);
    const doc = await this.model.findByIdAndUpdate(
      vendorId,
      {
        ...dto,
        serviceModes,
        onboardingCompleted: true,
        isActive: true,
      },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Vendor not found');
    return toVendor(doc);
  }

  async updateProfile(vendorId: string, dto: VendorUpdateProfileDto): Promise<Vendor> {
    const existing = await this.model.findById(vendorId);
    if (!existing) throw new NotFoundException('Vendor not found');
    const serviceTypes = dto.serviceTypes ?? existing.serviceTypes;
    const serviceModes = dto.serviceModes
      ? normalizeServiceModes(serviceTypes, dto.serviceModes)
      : existing.serviceModes;
    const doc = await this.model.findByIdAndUpdate(
      vendorId,
      { ...dto, serviceModes },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Vendor not found');
    return toVendor(doc);
  }

  async listPublic(params: {
    type?: VendorServiceType;
    lat?: number;
    lng?: number;
    q?: string;
  }): Promise<PublicVendorListItem[]> {
    const filter: Record<string, unknown> = {
      onboardingCompleted: true,
      isActive: true,
    };
    if (params.type) filter.serviceTypes = params.type;

    const docs = await this.model.find(filter).sort({ rating: -1 }).exec();
    const q = params.q?.trim().toLowerCase();

    let items = docs.map((doc) => {
      let distanceKm: number | undefined;
      if (params.lat != null && params.lng != null && doc.latitude && doc.longitude) {
        distanceKm = haversineKm(
          { latitude: params.lat, longitude: params.lng },
          { latitude: doc.latitude, longitude: doc.longitude },
        );
      }
      return { doc, distanceKm };
    });

    if (params.lat != null && params.lng != null) {
      items = items.filter(
        ({ doc, distanceKm }) =>
          distanceKm != null && distanceKm <= (doc.serviceRadiusKm || 10),
      );
    }

    if (q) {
      items = items.filter(({ doc }) => {
        const hay = `${doc.businessName} ${doc.displayTitle ?? ''} ${doc.city ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    items.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    return items.map(({ doc, distanceKm }) => toListItem(doc, distanceKm));
  }

  async getPublicDetail(id: string, lat?: number, lng?: number): Promise<PublicVendorDetail | null> {
    const doc = await this.model.findById(id);
    if (!doc || !doc.onboardingCompleted || !doc.isActive) return null;

    let distanceKm: number | undefined;
    if (lat != null && lng != null && doc.latitude && doc.longitude) {
      distanceKm = haversineKm(
        { latitude: lat, longitude: lng },
        { latitude: doc.latitude, longitude: doc.longitude },
      );
      if (distanceKm > (doc.serviceRadiusKm || 10)) return null;
    }

    const base = toListItem(doc, distanceKm);
    return {
      ...base,
      bio: doc.bio,
      address: doc.address,
      latitude: doc.latitude,
      longitude: doc.longitude,
      serviceRadiusKm: doc.serviceRadiusKm,
      weeklyAvailability: doc.weeklyAvailability ?? [],
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
