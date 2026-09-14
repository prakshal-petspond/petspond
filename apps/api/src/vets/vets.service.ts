import { BadRequestException, Injectable } from '@nestjs/common';
import type { Vet as VetRow } from '@prisma/client';
import type { Vet, VetWeeklyAvailabilityBlock } from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';

function toVet(row: VetRow): Vet {
  const weeklyAvailability =
    (row.weeklyAvailability as VetWeeklyAvailabilityBlock[] | null) ?? [];
  return {
    id: row.id,
    fullName: row.fullName ?? 'Vet',
    mobile: row.mobile,
    ...(row.email != null && row.email !== '' && { email: row.email }),
    emailVerified: row.emailVerified ?? false,
    phoneVerified: row.phoneVerified ?? false,
    veterinaryRegistrationNumber: row.veterinaryRegistrationNumber ?? '',
    yearOfRegistration: row.yearOfRegistration ?? 0,
    qualifications: row.qualifications ?? [],
    specializations: row.specializations ?? [],
    clinicId: row.clinicId ?? undefined,
    isClinicAdmin: row.isClinicAdmin ?? false,
    approvalStatus: (row.approvalStatus as Vet['approvalStatus']) ?? 'pending',
    onboardingCompleted: row.onboardingCompleted ?? false,
    ...(row.photoUrl != null && row.photoUrl !== '' && { photoUrl: row.photoUrl }),
    ...(row.displayTitle != null && row.displayTitle !== '' && { displayTitle: row.displayTitle }),
    weeklyAvailability: weeklyAvailability.map((b) => ({
      dayOfWeek: b.dayOfWeek,
      startMinute: b.startMinute,
      endMinute: b.endMinute,
    })),
    createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

@Injectable()
export class VetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByMobile(mobile: string): Promise<Vet | null> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    const row = await this.prisma.vet.findUnique({ where: { mobile: normalized } });
    return row ? toVet(row) : null;
  }

  async findByEmail(email: string): Promise<Vet | null> {
    const normalized = email.toLowerCase().trim();
    const row = await this.prisma.vet.findUnique({ where: { email: normalized } });
    return row ? toVet(row) : null;
  }

  async findByGoogleId(googleId: string): Promise<Vet | null> {
    const row = await this.prisma.vet.findUnique({ where: { googleId } });
    return row ? toVet(row) : null;
  }

  async findById(id: string): Promise<Vet | null> {
    const row = await this.prisma.vet.findUnique({ where: { id } });
    return row ? toVet(row) : null;
  }

  /** Pending team vet pre-added by a clinic admin (awaiting first login). */
  async findPendingClinicVeterinarian(clinicId: string): Promise<Vet | null> {
    const row = await this.prisma.vet.findFirst({
      where: {
        clinicId,
        onboardingCompleted: false,
        isClinicAdmin: false,
      },
      orderBy: { createdAt: 'asc' },
    });
    return row ? toVet(row) : null;
  }

  async assignMobileToVet(vetId: string, mobile: string): Promise<Vet> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    try {
      const row = await this.prisma.vet.update({
        where: { id: vetId },
        data: { mobile: normalized, phoneVerified: true },
      });
      return toVet(row);
    } catch {
      throw new BadRequestException('Vet not found');
    }
  }

  async createFromEmailRegistration(email: string, passwordHash: string): Promise<Vet> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.prisma.vet.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new BadRequestException('An account with this email already exists');

    const mobile = await this.generateUniquePlaceholderMobile();
    const row = await this.prisma.vet.create({
      data: {
        fullName: 'Vet',
        mobile,
        email: normalizedEmail,
        passwordHash,
        emailVerified: true,
        phoneVerified: false,
        veterinaryRegistrationNumber: 'PENDING',
        yearOfRegistration: new Date().getFullYear(),
        qualifications: [],
        specializations: [],
        approvalStatus: 'pending',
        isClinicAdmin: false,
        onboardingCompleted: false,
      },
    });
    return toVet(row);
  }

  async createFromGoogle(data: {
    googleId: string;
    email: string;
    fullName: string;
  }): Promise<Vet> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existingGoogle = await this.prisma.vet.findUnique({ where: { googleId: data.googleId } });
    if (existingGoogle) return toVet(existingGoogle);

    const existingEmail = await this.prisma.vet.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      if (existingEmail.googleId && existingEmail.googleId !== data.googleId) {
        throw new BadRequestException('Email is linked to another sign-in method');
      }
      try {
        const row = await this.prisma.vet.update({
          where: { id: existingEmail.id },
          data: {
            googleId: data.googleId,
            emailVerified: true,
            ...(data.fullName && existingEmail.fullName === 'Vet' && { fullName: data.fullName }),
          },
        });
        return toVet(row);
      } catch {
        throw new BadRequestException('Vet not found');
      }
    }

    const mobile = await this.generateUniquePlaceholderMobile();
    const row = await this.prisma.vet.create({
      data: {
        fullName: data.fullName.trim() || 'Vet',
        mobile,
        email: normalizedEmail,
        googleId: data.googleId,
        emailVerified: true,
        phoneVerified: false,
        veterinaryRegistrationNumber: 'PENDING',
        yearOfRegistration: new Date().getFullYear(),
        qualifications: [],
        specializations: [],
        approvalStatus: 'pending',
        isClinicAdmin: false,
        onboardingCompleted: false,
      },
    });
    return toVet(row);
  }

  async setPasswordHash(vetId: string, passwordHash: string): Promise<void> {
    await this.prisma.vet.update({
      where: { id: vetId },
      data: { passwordHash },
    });
  }

  async verifyPhone(vetId: string, mobile: string): Promise<Vet> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    if (normalized.length < 10) throw new BadRequestException('Invalid mobile number');

    const conflict = await this.prisma.vet.findFirst({
      where: { mobile: normalized, NOT: { id: vetId } },
    });
    if (conflict) throw new BadRequestException('This mobile number is already registered');

    try {
      const row = await this.prisma.vet.update({
        where: { id: vetId },
        data: { mobile: normalized, phoneVerified: true },
      });
      return toVet(row);
    } catch {
      throw new BadRequestException('Vet not found');
    }
  }

  async getPasswordHash(vetId: string): Promise<string | null> {
    const row = await this.prisma.vet.findUnique({
      where: { id: vetId },
      select: { passwordHash: true },
    });
    return row?.passwordHash ?? null;
  }

  async createOrFindByMobile(mobile: string): Promise<Vet> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    let row = await this.prisma.vet.findUnique({ where: { mobile: normalized } });
    if (!row) {
      row = await this.prisma.vet.create({
        data: {
          fullName: 'Vet',
          mobile: normalized,
          phoneVerified: true,
          veterinaryRegistrationNumber: 'PENDING',
          yearOfRegistration: 2000,
          qualifications: [],
          specializations: [],
          approvalStatus: 'pending',
          isClinicAdmin: false,
          onboardingCompleted: false,
        },
      });
    } else if (!row.phoneVerified) {
      row = await this.prisma.vet.update({
        where: { id: row.id },
        data: { phoneVerified: true },
      });
    }
    return toVet(row);
  }

  /** Adds a veterinarian to a clinic during admin onboarding (not front-office staff). */
  async createClinicVeterinarian(data: {
    clinicId: string;
    fullName: string;
    email?: string;
    mobile?: string;
    veterinaryRegistrationNumber?: string;
    specializations?: string[];
  }): Promise<Vet> {
    const normalizedMobile = data.mobile?.replace(/\D/g, '').slice(-10);
    const trimmedName = data.fullName.trim();

    if (normalizedMobile?.length === 10) {
      const existing = await this.prisma.vet.findUnique({ where: { mobile: normalizedMobile } });
      if (existing) {
        if (existing.clinicId && existing.clinicId !== data.clinicId) {
          throw new BadRequestException(`${trimmedName} is already linked to another clinic`);
        }
        try {
          const row = await this.prisma.vet.update({
            where: { id: existing.id },
            data: {
              fullName: trimmedName,
              ...(data.email?.trim() && { email: data.email.trim() }),
              clinicId: data.clinicId,
              veterinaryRegistrationNumber:
                data.veterinaryRegistrationNumber?.trim() ||
                existing.veterinaryRegistrationNumber ||
                'PENDING',
              specializations: data.specializations ?? existing.specializations ?? [],
              approvalStatus: 'pending',
              isClinicAdmin: false,
              onboardingCompleted: false,
            },
          });
          return toVet(row);
        } catch {
          throw new BadRequestException('Vet not found');
        }
      }
    }

    const mobile =
      normalizedMobile?.length === 10 ? normalizedMobile : await this.generateUniquePlaceholderMobile();

    const row = await this.prisma.vet.create({
      data: {
        fullName: trimmedName,
        mobile,
        ...(data.email?.trim() && { email: data.email.trim() }),
        veterinaryRegistrationNumber: data.veterinaryRegistrationNumber?.trim() || 'PENDING',
        yearOfRegistration: new Date().getFullYear(),
        qualifications: [],
        specializations: data.specializations ?? [],
        clinicId: data.clinicId,
        isClinicAdmin: false,
        approvalStatus: 'pending',
        onboardingCompleted: false,
      },
    });
    return toVet(row);
  }

  private async generateUniquePlaceholderMobile(): Promise<string> {
    for (let attempt = 0; attempt < 25; attempt++) {
      const candidate = `8${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;
      const exists = await this.prisma.vet.findUnique({
        where: { mobile: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    throw new BadRequestException('Could not create veterinarian record');
  }

  async acceptClinicMembership(vetId: string, clinicId: string): Promise<Vet> {
    try {
      const row = await this.prisma.vet.update({
        where: { id: vetId },
        data: {
          clinicId,
          onboardingCompleted: true,
          approvalStatus: 'approved',
          isClinicAdmin: false,
        },
      });
      return toVet(row);
    } catch {
      throw new BadRequestException('Vet not found');
    }
  }

  async updateOnboarding(
    vetId: string,
    data: {
      fullName: string;
      email?: string;
      veterinaryRegistrationNumber: string;
      yearOfRegistration: number;
      qualifications: string[];
      specializations: string[];
      clinicId?: string;
      isClinicAdmin?: boolean;
      approvalStatus?: 'pending' | 'approved';
      photoUrl?: string;
      displayTitle?: string;
    },
  ): Promise<Vet> {
    try {
      const row = await this.prisma.vet.update({
        where: { id: vetId },
        data: {
          fullName: data.fullName,
          ...(data.email != null && { email: data.email }),
          veterinaryRegistrationNumber: data.veterinaryRegistrationNumber,
          yearOfRegistration: data.yearOfRegistration,
          qualifications: data.qualifications,
          specializations: data.specializations,
          ...(data.clinicId != null && { clinicId: data.clinicId }),
          ...(data.isClinicAdmin != null && { isClinicAdmin: data.isClinicAdmin }),
          ...(data.approvalStatus != null && { approvalStatus: data.approvalStatus }),
          ...(data.photoUrl != null && { photoUrl: data.photoUrl }),
          ...(data.displayTitle != null && { displayTitle: data.displayTitle }),
          onboardingCompleted: true,
        },
      });
      return toVet(row);
    } catch {
      throw new Error('Vet not found');
    }
  }

  async findByClinicId(clinicId: string): Promise<Vet[]> {
    const rows = await this.prisma.vet.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toVet);
  }

  async findApprovedByClinicId(clinicId: string): Promise<Vet[]> {
    const rows = await this.prisma.vet.findMany({
      where: { clinicId, onboardingCompleted: true, approvalStatus: 'approved' },
      orderBy: [{ isClinicAdmin: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map(toVet);
  }

  /**
   * Vets shown on Find Vet / public clinic pages: onboarded vets who are either approved
   * or clinic admin (creator). Queried by clinicId so listings still work if adminVetId on
   * the clinic document is wrong or stale. Schedule / weeklyAvailability does not affect this.
   */
  async findVetsForPublicClinicView(clinicId: string, _adminVetId: string): Promise<Vet[]> {
    const rows = await this.prisma.vet.findMany({
      where: { clinicId, onboardingCompleted: true },
      orderBy: [{ isClinicAdmin: 'desc' }, { createdAt: 'asc' }],
    });
    return rows
      .filter((d) => d.approvalStatus === 'approved' || d.isClinicAdmin)
      .map(toVet);
  }

  async countApprovedInClinic(clinicId: string): Promise<number> {
    return this.prisma.vet.count({
      where: {
        clinicId,
        onboardingCompleted: true,
        approvalStatus: 'approved',
      },
    });
  }

  async approve(vetId: string): Promise<Vet> {
    try {
      const row = await this.prisma.vet.update({
        where: { id: vetId },
        data: { approvalStatus: 'approved' },
      });
      return toVet(row);
    } catch {
      throw new Error('Vet not found');
    }
  }

  private validateWeeklyBlocks(blocks: VetWeeklyAvailabilityBlock[]): void {
    if (blocks.length > 64) {
      throw new BadRequestException('Too many availability windows (max 64)');
    }
    for (const b of blocks) {
      if (b.dayOfWeek < 0 || b.dayOfWeek > 6) throw new BadRequestException('Invalid dayOfWeek');
      if (b.startMinute < 0 || b.startMinute > 1439) throw new BadRequestException('Invalid startMinute');
      if (b.endMinute < 1 || b.endMinute > 1440) throw new BadRequestException('Invalid endMinute');
      if (b.startMinute >= b.endMinute) {
        throw new BadRequestException('Each availability window must have positive length');
      }
    }
  }

  async setWeeklyAvailability(vetId: string, blocks: VetWeeklyAvailabilityBlock[]): Promise<Vet> {
    this.validateWeeklyBlocks(blocks);
    try {
      const row = await this.prisma.vet.update({
        where: { id: vetId },
        data: { weeklyAvailability: blocks as unknown as import('@prisma/client').Prisma.InputJsonValue },
      });
      return toVet(row);
    } catch {
      throw new BadRequestException('Vet not found');
    }
  }

  async listTeamSchedulesForClinic(clinicId: string): Promise<
    { vetId: string; fullName: string; weeklyAvailability: VetWeeklyAvailabilityBlock[] }[]
  > {
    const rows = await this.prisma.vet.findMany({
      where: { clinicId, onboardingCompleted: true, approvalStatus: 'approved' },
      orderBy: [{ isClinicAdmin: 'desc' }, { fullName: 'asc' }],
    });
    return rows.map((d) => {
      const weeklyAvailability =
        (d.weeklyAvailability as VetWeeklyAvailabilityBlock[] | null) ?? [];
      return {
        vetId: d.id,
        fullName: d.fullName ?? 'Vet',
        weeklyAvailability: weeklyAvailability.map((b) => ({
          dayOfWeek: b.dayOfWeek,
          startMinute: b.startMinute,
          endMinute: b.endMinute,
        })),
      };
    });
  }
}
