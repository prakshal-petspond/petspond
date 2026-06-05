import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Clinic, CreateClinicDto, PublicClinicDetail, PublicClinicListItem, UpdateClinicDto } from '@petspond/types';
import { ClinicDocument } from './clinic.schema';
import { VetsService } from '@/vets/vets.service';

function toClinic(doc: ClinicDocument): Clinic {
  return {
    id: doc._id.toString(),
    name: doc.name,
    totalDoctors: doc.totalDoctors ?? 1,
    address: doc.address,
    pincode: doc.pincode,
    city: doc.city,
    state: doc.state,
    country: doc.country,
    latitude: doc.latitude,
    longitude: doc.longitude,
    placeId: doc.placeId,
    adminVetId: doc.adminVetId,
    listingImage: doc.listingImage,
    heroImage: doc.heroImage,
    tagline: doc.tagline,
    rating: doc.rating ?? 4.5,
    reviewCount: doc.reviewCount ?? 0,
    is24_7: doc.is24_7 ?? false,
    closingTimeLabel: doc.closingTimeLabel,
    hours: doc.hours?.length ? doc.hours.map((h) => ({ day: h.day, hours: h.hours })) : [],
    facilities: doc.facilities ?? [],
    photoGallery: doc.photoGallery ?? [],
    servicesOffered: doc.servicesOffered ?? [],
    vaccinesOffered: doc.vaccinesOffered ?? [],
    acceptsConsultations: doc.acceptsConsultations ?? true,
    acceptsVaccinations: doc.acceptsVaccinations ?? true,
    establishedYear: doc.establishedYear,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

@Injectable()
export class ClinicsService {
  constructor(
    @InjectModel(ClinicDocument.name) private readonly clinicModel: Model<ClinicDocument>,
    private readonly vetsService: VetsService,
  ) {}

  async findAll(): Promise<Clinic[]> {
    const docs = await this.clinicModel.find().sort({ name: 1 }).exec();
    return docs.map(toClinic);
  }

  async findById(id: string): Promise<Clinic | null> {
    const doc = await this.clinicModel.findById(id).exec();
    return doc ? toClinic(doc) : null;
  }

  async create(
    data: CreateClinicDto & {
      adminVetId: string;
      servicesOffered?: { id: string; name: string; icon: string }[];
    },
  ): Promise<Clinic> {
    const doc = await this.clinicModel.create({
      name: data.name,
      totalDoctors: Math.max(1, data.totalDoctors),
      address: data.address,
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      placeId: data.placeId,
      adminVetId: data.adminVetId,
      tagline: data.tagline,
      listingImage: data.listingImage,
      heroImage: data.heroImage,
      acceptsConsultations: data.acceptsConsultations ?? true,
      acceptsVaccinations: data.acceptsVaccinations ?? true,
      hours: [
        { day: 'Mon - Fri', hours: '9:00 AM - 8:00 PM' },
        { day: 'Saturday', hours: '10:00 AM - 6:00 PM' },
        { day: 'Sunday', hours: '10:00 AM - 4:00 PM' },
      ],
      facilities: ['Consultation', 'Pharmacy', 'Vaccination'],
      servicesOffered: data.servicesOffered?.length
        ? data.servicesOffered
        : [
            { id: 'checkup', name: 'General Checkup', icon: 'medical' },
            { id: 'vax', name: 'Vaccination', icon: 'bandage' },
          ],
      vaccinesOffered: [
        { id: 'rabies', name: 'Rabies', pricePaise: 50000 },
        { id: 'dhpp', name: 'DHPP', pricePaise: 45000 },
      ],
    });
    return toClinic(doc);
  }

  async updateById(id: string, patch: UpdateClinicDto): Promise<Clinic> {
    const doc = await this.clinicModel
      .findByIdAndUpdate(
        id,
        { $set: { ...stripUndefined(patch as unknown as Record<string, unknown>) } },
        { new: true, runValidators: true },
      )
      .exec();
    if (!doc) throw new NotFoundException('Clinic not found');
    return toClinic(doc);
  }

  async syncDoctorCount(clinicId: string): Promise<void> {
    const n = await this.vetsService.countApprovedInClinic(clinicId);
    await this.clinicModel
      .findByIdAndUpdate(clinicId, { $set: { totalDoctors: Math.max(1, n) } })
      .exec();
  }

  async listPublicConsultation(): Promise<PublicClinicListItem[]> {
    const docs = await this.clinicModel
      .find({ acceptsConsultations: true })
      .sort({ name: 1 })
      .exec();
    const out: PublicClinicListItem[] = [];
    for (const doc of docs) {
      const item = await this.toPublicListItem(doc);
      if (item) out.push(item);
    }
    return out;
  }

  async listPublicVaccination(): Promise<PublicClinicListItem[]> {
    const docs = await this.clinicModel
      .find({ acceptsVaccinations: true, 'vaccinesOffered.0': { $exists: true } })
      .sort({ name: 1 })
      .exec();
    const out: PublicClinicListItem[] = [];
    for (const doc of docs) {
      const item = await this.toPublicListItem(doc);
      if (item) out.push(item);
    }
    return out;
  }

  async getPublicDetail(clinicId: string): Promise<PublicClinicDetail | null> {
    const doc = await this.clinicModel.findById(clinicId).exec();
    if (!doc) return null;
    const base = await this.toPublicListItem(doc);
    if (!base) return null;
    const vets = await this.vetsService.findVetsForPublicClinicView(clinicId, doc.adminVetId);
    const doctors = vets.map((v) => ({
      id: v.id,
      fullName: v.fullName,
      specializations: v.specializations,
      photoUrl: v.photoUrl,
      displayTitle: v.displayTitle ?? (v.specializations[0] ?? 'Veterinarian'),
      weeklyAvailability: v.weeklyAvailability ?? [],
    }));
    return {
      ...base,
      tagline: doc.tagline,
      listingImage: doc.listingImage,
      heroImage: doc.heroImage,
      photoGallery: doc.photoGallery ?? [],
      facilities: doc.facilities ?? [],
      hours: doc.hours?.length ? doc.hours.map((h) => ({ day: h.day, hours: h.hours })) : [],
      servicesOffered: doc.servicesOffered ?? [],
      totalDoctors: doctors.length > 0 ? doctors.length : doc.totalDoctors ?? 1,
      establishedYear: doc.establishedYear,
      doctors,
    };
  }

  private async toPublicListItem(doc: ClinicDocument): Promise<PublicClinicListItem | null> {
    const clinic = toClinic(doc);
    const vets = await this.vetsService.findVetsForPublicClinicView(doc._id.toString(), doc.adminVetId);
    if (vets.length === 0) return null;
    const adminFirst = [...vets].sort((a, b) => Number(b.isClinicAdmin) - Number(a.isClinicAdmin));
    const primary = adminFirst[0]!;
    const vaccines = clinic.vaccinesOffered ?? [];
    const lowest =
      vaccines.length > 0 ? Math.min(...vaccines.map((v) => v.pricePaise)) : undefined;
    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      pincode: clinic.pincode,
      city: clinic.city,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      primaryDoctor: {
        id: primary.id,
        fullName: primary.fullName,
        specializations: primary.specializations,
        photoUrl: primary.photoUrl,
        displayTitle: primary.displayTitle ?? (primary.specializations[0] ?? 'Veterinarian'),
      },
      rating: clinic.rating,
      reviewCount: clinic.reviewCount,
      is24_7: clinic.is24_7,
      closingTimeLabel: clinic.closingTimeLabel,
      vaccinesOffered: vaccines,
      lowestVaccinationPricePaise: lowest,
      acceptsConsultations: clinic.acceptsConsultations,
      acceptsVaccinations: clinic.acceptsVaccinations,
    };
  }
}

function stripUndefined<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(o)) {
    const v = o[k as keyof T];
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
