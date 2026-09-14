import { Injectable, NotFoundException } from '@nestjs/common';
import type { Clinic as ClinicRow, Prisma } from '@prisma/client';
import type {
  Clinic,
  CreateClinicDto,
  PublicClinicDetail,
  PublicClinicListItem,
  UpdateClinicDto,
} from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';
import { VetsService } from '@/vets/vets.service';

type HourEntry = { day: string; hours: string };
type ServiceOffered = { id: string; name: string; icon: string };
type VaccineOffered = { id: string; name: string; pricePaise: number };

function toClinic(row: ClinicRow): Clinic {
  const hours = (row.hours as HourEntry[] | null) ?? [];
  const servicesOffered = (row.servicesOffered as ServiceOffered[] | null) ?? [];
  const vaccinesOffered = (row.vaccinesOffered as VaccineOffered[] | null) ?? [];
  return {
    id: row.id,
    name: row.name,
    totalDoctors: row.totalDoctors ?? 1,
    address: row.address,
    pincode: row.pincode,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    country: row.country ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    placeId: row.placeId ?? undefined,
    adminVetId: row.adminVetId,
    listingImage: row.listingImage ?? undefined,
    heroImage: row.heroImage ?? undefined,
    tagline: row.tagline ?? undefined,
    rating: row.rating ?? 4.5,
    reviewCount: row.reviewCount ?? 0,
    is24_7: row.is24_7 ?? false,
    closingTimeLabel: row.closingTimeLabel ?? undefined,
    hours: hours.map((h) => ({ day: h.day, hours: h.hours })),
    facilities: row.facilities ?? [],
    photoGallery: row.photoGallery ?? [],
    servicesOffered,
    vaccinesOffered,
    acceptsConsultations: row.acceptsConsultations ?? true,
    acceptsVaccinations: row.acceptsVaccinations ?? true,
    establishedYear: row.establishedYear ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class ClinicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vetsService: VetsService,
  ) {}

  async findAll(): Promise<Clinic[]> {
    const rows = await this.prisma.clinic.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toClinic);
  }

  async findById(id: string): Promise<Clinic | null> {
    const row = await this.prisma.clinic.findUnique({ where: { id } });
    return row ? toClinic(row) : null;
  }

  async create(
    data: CreateClinicDto & {
      adminVetId: string;
      servicesOffered?: { id: string; name: string; icon: string }[];
    },
  ): Promise<Clinic> {
    const row = await this.prisma.clinic.create({
      data: {
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
      },
    });
    return toClinic(row);
  }

  async updateById(id: string, patch: UpdateClinicDto): Promise<Clinic> {
    const data = stripUndefined(patch as unknown as Record<string, unknown>) as Prisma.ClinicUpdateInput;
    try {
      const row = await this.prisma.clinic.update({ where: { id }, data });
      return toClinic(row);
    } catch {
      throw new NotFoundException('Clinic not found');
    }
  }

  async syncDoctorCount(clinicId: string): Promise<void> {
    const n = await this.vetsService.countApprovedInClinic(clinicId);
    await this.prisma.clinic.update({
      where: { id: clinicId },
      data: { totalDoctors: Math.max(1, n) },
    });
  }

  async listPublicConsultation(): Promise<PublicClinicListItem[]> {
    const rows = await this.prisma.clinic.findMany({
      where: { acceptsConsultations: true },
      orderBy: { name: 'asc' },
    });
    const out: PublicClinicListItem[] = [];
    for (const row of rows) {
      const item = await this.toPublicListItem(row);
      if (item) out.push(item);
    }
    return out;
  }

  async listPublicVaccination(): Promise<PublicClinicListItem[]> {
    const rows = await this.prisma.clinic.findMany({
      where: { acceptsVaccinations: true },
      orderBy: { name: 'asc' },
    });
    const withVaccines = rows.filter((r) => {
      const vaccines = (r.vaccinesOffered as VaccineOffered[] | null) ?? [];
      return vaccines.length > 0;
    });
    const out: PublicClinicListItem[] = [];
    for (const row of withVaccines) {
      const item = await this.toPublicListItem(row);
      if (item) out.push(item);
    }
    return out;
  }

  async getPublicDetail(clinicId: string): Promise<PublicClinicDetail | null> {
    const row = await this.prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!row) return null;
    const base = await this.toPublicListItem(row);
    if (!base) return null;
    const vets = await this.vetsService.findVetsForPublicClinicView(clinicId, row.adminVetId);
    const doctors = vets.map((v) => ({
      id: v.id,
      fullName: v.fullName,
      specializations: v.specializations,
      photoUrl: v.photoUrl,
      displayTitle: v.displayTitle ?? (v.specializations[0] ?? 'Veterinarian'),
      weeklyAvailability: v.weeklyAvailability ?? [],
    }));
    const hours = (row.hours as HourEntry[] | null) ?? [];
    const servicesOffered = (row.servicesOffered as ServiceOffered[] | null) ?? [];
    return {
      ...base,
      tagline: row.tagline ?? undefined,
      listingImage: row.listingImage ?? undefined,
      heroImage: row.heroImage ?? undefined,
      photoGallery: row.photoGallery ?? [],
      facilities: row.facilities ?? [],
      hours: hours.map((h) => ({ day: h.day, hours: h.hours })),
      servicesOffered,
      totalDoctors: doctors.length > 0 ? doctors.length : row.totalDoctors ?? 1,
      establishedYear: row.establishedYear ?? undefined,
      doctors,
    };
  }

  private async toPublicListItem(row: ClinicRow): Promise<PublicClinicListItem | null> {
    const clinic = toClinic(row);
    const vets = await this.vetsService.findVetsForPublicClinicView(row.id, row.adminVetId);
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
