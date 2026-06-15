import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Vet, VetWeeklyAvailabilityBlock } from '@petspond/types';
import { VetDocument } from './vet.schema';

function toVet(doc: VetDocument): Vet {
  return {
    id: doc._id.toString(),
    fullName: doc.fullName ?? 'Vet',
    mobile: doc.mobile,
    ...(doc.email != null && doc.email !== '' && { email: doc.email }),
    emailVerified: doc.emailVerified ?? false,
    phoneVerified: doc.phoneVerified ?? false,
    veterinaryRegistrationNumber: doc.veterinaryRegistrationNumber ?? '',
    yearOfRegistration: doc.yearOfRegistration ?? 0,
    qualifications: doc.qualifications ?? [],
    specializations: doc.specializations ?? [],
    clinicId: doc.clinicId,
    isClinicAdmin: doc.isClinicAdmin ?? false,
    approvalStatus: (doc.approvalStatus as Vet['approvalStatus']) ?? 'pending',
    onboardingCompleted: doc.onboardingCompleted ?? false,
    ...(doc.photoUrl != null && doc.photoUrl !== '' && { photoUrl: doc.photoUrl }),
    ...(doc.displayTitle != null && doc.displayTitle !== '' && { displayTitle: doc.displayTitle }),
    weeklyAvailability: (doc.weeklyAvailability ?? []).map((b) => ({
      dayOfWeek: b.dayOfWeek,
      startMinute: b.startMinute,
      endMinute: b.endMinute,
    })),
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

@Injectable()
export class VetsService {
  constructor(
    @InjectModel(VetDocument.name) private readonly vetModel: Model<VetDocument>,
  ) {}

  async findByMobile(mobile: string): Promise<Vet | null> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    const doc = await this.vetModel.findOne({ mobile: normalized }).exec();
    return doc ? toVet(doc) : null;
  }

  async findByEmail(email: string): Promise<Vet | null> {
    const normalized = email.toLowerCase().trim();
    const doc = await this.vetModel.findOne({ email: normalized }).exec();
    return doc ? toVet(doc) : null;
  }

  async findByGoogleId(googleId: string): Promise<Vet | null> {
    const doc = await this.vetModel.findOne({ googleId }).exec();
    return doc ? toVet(doc) : null;
  }

  async findById(id: string): Promise<Vet | null> {
    const doc = await this.vetModel.findById(id).exec();
    return doc ? toVet(doc) : null;
  }

  /** Pending team vet pre-added by a clinic admin (awaiting first login). */
  async findPendingClinicVeterinarian(clinicId: string): Promise<Vet | null> {
    const doc = await this.vetModel
      .findOne({
        clinicId,
        onboardingCompleted: false,
        isClinicAdmin: false,
      })
      .sort({ createdAt: 1 })
      .exec();
    return doc ? toVet(doc) : null;
  }

  async assignMobileToVet(vetId: string, mobile: string): Promise<Vet> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    const doc = await this.vetModel
      .findByIdAndUpdate(vetId, { $set: { mobile: normalized, phoneVerified: true } }, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new BadRequestException('Vet not found');
    return toVet(doc);
  }

  async createFromEmailRegistration(email: string, passwordHash: string): Promise<Vet> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.vetModel.findOne({ email: normalizedEmail }).exec();
    if (existing) throw new BadRequestException('An account with this email already exists');

    const mobile = await this.generateUniquePlaceholderMobile();
    const doc = await this.vetModel.create({
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
    });
    return toVet(doc);
  }

  async createFromGoogle(data: {
    googleId: string;
    email: string;
    fullName: string;
  }): Promise<Vet> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existingGoogle = await this.vetModel.findOne({ googleId: data.googleId }).exec();
    if (existingGoogle) return toVet(existingGoogle);

    const existingEmail = await this.vetModel.findOne({ email: normalizedEmail }).exec();
    if (existingEmail) {
      if (existingEmail.googleId && existingEmail.googleId !== data.googleId) {
        throw new BadRequestException('Email is linked to another sign-in method');
      }
      const doc = await this.vetModel
        .findByIdAndUpdate(
          existingEmail._id,
          {
            $set: {
              googleId: data.googleId,
              emailVerified: true,
              ...(data.fullName && existingEmail.fullName === 'Vet' && { fullName: data.fullName }),
            },
          },
          { new: true },
        )
        .exec();
      if (!doc) throw new BadRequestException('Vet not found');
      return toVet(doc);
    }

    const mobile = await this.generateUniquePlaceholderMobile();
    const doc = await this.vetModel.create({
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
    });
    return toVet(doc);
  }

  async setPasswordHash(vetId: string, passwordHash: string): Promise<void> {
    await this.vetModel.findByIdAndUpdate(vetId, { $set: { passwordHash } }).exec();
  }

  async verifyPhone(vetId: string, mobile: string): Promise<Vet> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    if (normalized.length < 10) throw new BadRequestException('Invalid mobile number');

    const conflict = await this.vetModel
      .findOne({ mobile: normalized, _id: { $ne: vetId } })
      .exec();
    if (conflict) throw new BadRequestException('This mobile number is already registered');

    const doc = await this.vetModel
      .findByIdAndUpdate(
        vetId,
        { $set: { mobile: normalized, phoneVerified: true } },
        { new: true, runValidators: true },
      )
      .exec();
    if (!doc) throw new BadRequestException('Vet not found');
    return toVet(doc);
  }

  async getPasswordHash(vetId: string): Promise<string | null> {
    const doc = await this.vetModel.findById(vetId).select('passwordHash').exec();
    return doc?.passwordHash ?? null;
  }

  async createOrFindByMobile(mobile: string): Promise<Vet> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    let doc = await this.vetModel.findOne({ mobile: normalized }).exec();
    if (!doc) {
      doc = await this.vetModel.create({
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
      });
    } else if (!doc.phoneVerified) {
      doc.phoneVerified = true;
      await doc.save();
    }
    return toVet(doc);
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
      const existing = await this.vetModel.findOne({ mobile: normalizedMobile }).exec();
      if (existing) {
        if (existing.clinicId && existing.clinicId !== data.clinicId) {
          throw new BadRequestException(`${trimmedName} is already linked to another clinic`);
        }
        const doc = await this.vetModel
          .findByIdAndUpdate(
            existing._id,
            {
              $set: {
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
            },
            { new: true, runValidators: true },
          )
          .exec();
        if (!doc) throw new BadRequestException('Vet not found');
        return toVet(doc);
      }
    }

    const mobile =
      normalizedMobile?.length === 10 ? normalizedMobile : await this.generateUniquePlaceholderMobile();

    const doc = await this.vetModel.create({
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
    });
    return toVet(doc);
  }

  private async generateUniquePlaceholderMobile(): Promise<string> {
    for (let attempt = 0; attempt < 25; attempt++) {
      const candidate = `8${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;
      const exists = await this.vetModel.exists({ mobile: candidate });
      if (!exists) return candidate;
    }
    throw new BadRequestException('Could not create veterinarian record');
  }

  async acceptClinicMembership(vetId: string, clinicId: string): Promise<Vet> {
    const doc = await this.vetModel
      .findByIdAndUpdate(
        vetId,
        {
          $set: {
            clinicId,
            onboardingCompleted: true,
            approvalStatus: 'approved',
            isClinicAdmin: false,
          },
        },
        { new: true, runValidators: true },
      )
      .exec();
    if (!doc) throw new BadRequestException('Vet not found');
    return toVet(doc);
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
    const doc = await this.vetModel
      .findByIdAndUpdate(
        vetId,
        {
          $set: {
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
        },
        { new: true, runValidators: true },
      )
      .exec();
    if (!doc) throw new Error('Vet not found');
    return toVet(doc);
  }

  async findByClinicId(clinicId: string): Promise<Vet[]> {
    const docs = await this.vetModel.find({ clinicId }).sort({ createdAt: 1 }).exec();
    return docs.map(toVet);
  }

  async findApprovedByClinicId(clinicId: string): Promise<Vet[]> {
    const docs = await this.vetModel
      .find({ clinicId, onboardingCompleted: true, approvalStatus: 'approved' })
      .sort({ isClinicAdmin: -1, createdAt: 1 })
      .exec();
    return docs.map(toVet);
  }

  /**
   * Vets shown on Find Vet / public clinic pages: onboarded vets who are either approved
   * or clinic admin (creator). Queried by clinicId so listings still work if adminVetId on
   * the clinic document is wrong or stale. Schedule / weeklyAvailability does not affect this.
   */
  async findVetsForPublicClinicView(clinicId: string, _adminVetId: string): Promise<Vet[]> {
    const docs = await this.vetModel
      .find({ clinicId, onboardingCompleted: true })
      .sort({ isClinicAdmin: -1, createdAt: 1 })
      .exec();
    return docs
      .filter((d) => d.approvalStatus === 'approved' || d.isClinicAdmin)
      .map(toVet);
  }

  async countApprovedInClinic(clinicId: string): Promise<number> {
    return this.vetModel.countDocuments({
      clinicId,
      onboardingCompleted: true,
      approvalStatus: 'approved',
    });
  }

  async approve(vetId: string): Promise<Vet> {
    const doc = await this.vetModel
      .findByIdAndUpdate(vetId, { $set: { approvalStatus: 'approved' } }, { new: true })
      .exec();
    if (!doc) throw new Error('Vet not found');
    return toVet(doc);
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
    const doc = await this.vetModel
      .findByIdAndUpdate(vetId, { $set: { weeklyAvailability: blocks } }, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new BadRequestException('Vet not found');
    return toVet(doc);
  }

  async listTeamSchedulesForClinic(clinicId: string): Promise<
    { vetId: string; fullName: string; weeklyAvailability: VetWeeklyAvailabilityBlock[] }[]
  > {
    const docs = await this.vetModel
      .find({ clinicId, onboardingCompleted: true, approvalStatus: 'approved' })
      .sort({ isClinicAdmin: -1, fullName: 1 })
      .exec();
    return docs.map((d) => ({
      vetId: d._id.toString(),
      fullName: d.fullName ?? 'Vet',
      weeklyAvailability: (d.weeklyAvailability ?? []).map((b) => ({
        dayOfWeek: b.dayOfWeek,
        startMinute: b.startMinute,
        endMinute: b.endMinute,
      })),
    }));
  }
}
