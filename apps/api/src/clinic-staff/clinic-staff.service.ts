import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ClinicStaffMember } from '@petspond/types';
import { ClinicStaffDocument } from './clinic-staff.schema';

function toStaff(doc: ClinicStaffDocument): ClinicStaffMember {
  return {
    id: doc._id.toString(),
    clinicId: doc.clinicId,
    role: 'front_office',
    fullName: doc.fullName,
    ...(doc.email && { email: doc.email }),
    ...(doc.mobile && { mobile: doc.mobile }),
    createdByVetId: doc.createdByVetId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export type CreateClinicStaffInput = {
  clinicId: string;
  fullName: string;
  email?: string;
  mobile?: string;
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
        role: 'front_office' as const,
        fullName: item.fullName.trim(),
        ...(item.email?.trim() && { email: item.email.trim() }),
        ...(item.mobile?.replace(/\D/g, '').slice(-10) && {
          mobile: item.mobile.replace(/\D/g, '').slice(-10),
        }),
        createdByVetId: item.createdByVetId,
      })),
    );
    return docs.map((d) => toStaff(d as ClinicStaffDocument));
  }

  async findByClinicId(clinicId: string): Promise<ClinicStaffMember[]> {
    const docs = await this.staffModel.find({ clinicId }).sort({ createdAt: 1 }).exec();
    return docs.map(toStaff);
  }

}
