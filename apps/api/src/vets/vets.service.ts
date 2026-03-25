import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Vet } from '@petspond/types';
import { VetDocument } from './vet.schema';

function toVet(doc: VetDocument): Vet {
  return {
    id: doc._id.toString(),
    fullName: doc.fullName ?? 'Vet',
    mobile: doc.mobile,
    ...(doc.email != null && doc.email !== '' && { email: doc.email }),
    veterinaryRegistrationNumber: doc.veterinaryRegistrationNumber ?? '',
    yearOfRegistration: doc.yearOfRegistration ?? 0,
    qualifications: doc.qualifications ?? [],
    specializations: doc.specializations ?? [],
    clinicId: doc.clinicId,
    isClinicAdmin: doc.isClinicAdmin ?? false,
    approvalStatus: (doc.approvalStatus as Vet['approvalStatus']) ?? 'pending',
    onboardingCompleted: doc.onboardingCompleted ?? false,
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

  async findById(id: string): Promise<Vet | null> {
    const doc = await this.vetModel.findById(id).exec();
    return doc ? toVet(doc) : null;
  }

  async createOrFindByMobile(mobile: string): Promise<Vet> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    let doc = await this.vetModel.findOne({ mobile: normalized }).exec();
    if (!doc) {
      doc = await this.vetModel.create({
        fullName: 'Vet',
        mobile: normalized,
        veterinaryRegistrationNumber: 'PENDING',
        yearOfRegistration: 2000,
        qualifications: [],
        specializations: [],
        approvalStatus: 'pending',
        isClinicAdmin: false,
        onboardingCompleted: false,
      });
    }
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

  async approve(vetId: string): Promise<Vet> {
    const doc = await this.vetModel
      .findByIdAndUpdate(vetId, { $set: { approvalStatus: 'approved' } }, { new: true })
      .exec();
    if (!doc) throw new Error('Vet not found');
    return toVet(doc);
  }
}
