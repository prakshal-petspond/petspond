import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ClinicStaffMember, ClinicStaffRole } from '@petspond/types';
import { ClinicStaffDocument } from './clinic-staff.schema';

function toStaff(doc: ClinicStaffDocument): ClinicStaffMember {
  return {
    id: doc._id.toString(),
    clinicId: doc.clinicId,
    role: doc.role as ClinicStaffRole,
    fullName: doc.fullName,
    ...(doc.email && { email: doc.email }),
    ...(doc.mobile && { mobile: doc.mobile }),
    ...(doc.veterinaryRegistrationNumber && {
      veterinaryRegistrationNumber: doc.veterinaryRegistrationNumber,
    }),
    specializations: doc.specializations ?? [],
    ...(doc.linkedVetId && { linkedVetId: doc.linkedVetId }),
    createdByVetId: doc.createdByVetId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export type CreateClinicStaffInput = {
  clinicId: string;
  role: ClinicStaffRole;
  fullName: string;
  email?: string;
  mobile?: string;
  veterinaryRegistrationNumber?: string;
  specializations?: string[];
  createdByVetId: string;
};

@Injectable()
export class ClinicStaffService {
  constructor(
    @InjectModel(ClinicStaffDocument.name)
    private readonly staffModel: Model<ClinicStaffDocument>,
  ) {}

  async createMany(items: CreateClinicStaffInput[]): Promise<ClinicStaffMember[]> {
    if (!items.length) return [];
    const docs = await this.staffModel.insertMany(
      items.map((item) => ({
        clinicId: item.clinicId,
        role: item.role,
        fullName: item.fullName.trim(),
        ...(item.email?.trim() && { email: item.email.trim() }),
        ...(item.mobile?.replace(/\D/g, '').slice(-10) && {
          mobile: item.mobile.replace(/\D/g, '').slice(-10),
        }),
        ...(item.veterinaryRegistrationNumber?.trim() && {
          veterinaryRegistrationNumber: item.veterinaryRegistrationNumber.trim(),
        }),
        specializations: item.specializations ?? [],
        createdByVetId: item.createdByVetId,
      })),
    );
    return docs.map((d) => toStaff(d as ClinicStaffDocument));
  }

  async findByClinicId(clinicId: string): Promise<ClinicStaffMember[]> {
    const docs = await this.staffModel.find({ clinicId }).sort({ createdAt: 1 }).exec();
    return docs.map(toStaff);
  }

  async findByClinicAndRole(clinicId: string, role: ClinicStaffRole): Promise<ClinicStaffMember[]> {
    const docs = await this.staffModel
      .find({ clinicId, role })
      .sort({ createdAt: 1 })
      .exec();
    return docs.map(toStaff);
  }
}
