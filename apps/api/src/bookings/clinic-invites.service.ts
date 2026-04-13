import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ClinicInviteDto } from '@petspond/types';
import { ClinicInviteDocument } from './clinic-invite.schema';

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

function toDto(doc: ClinicInviteDocument): ClinicInviteDto {
  return {
    id: doc._id.toString(),
    clinicId: doc.clinicId,
    mobile: doc.mobile,
    createdAt: doc.createdAt.toISOString(),
    createdByVetId: doc.createdByVetId,
  };
}

@Injectable()
export class ClinicInvitesService {
  constructor(
    @InjectModel(ClinicInviteDocument.name) private readonly inviteModel: Model<ClinicInviteDocument>,
  ) {}

  async createInvite(clinicId: string, mobileRaw: string, createdByVetId: string): Promise<ClinicInviteDto> {
    const mobile = normalizeMobile(mobileRaw);
    if (mobile.length !== 10) {
      throw new BadRequestException('Enter a valid 10-digit mobile number');
    }
    try {
      const doc = await this.inviteModel.create({ clinicId, mobile, createdByVetId });
      return toDto(doc);
    } catch {
      throw new BadRequestException('This number is already invited to your clinic');
    }
  }

  async listForClinic(clinicId: string): Promise<ClinicInviteDto[]> {
    const docs = await this.inviteModel.find({ clinicId }).sort({ createdAt: -1 }).exec();
    return docs.map(toDto);
  }

  /** Returns clinicId if an invite existed and was consumed, else null */
  async consumePendingMobile(mobileRaw: string): Promise<string | null> {
    const mobile = normalizeMobile(mobileRaw);
    const doc = await this.inviteModel.findOneAndDelete({ mobile }).exec();
    return doc ? doc.clinicId : null;
  }
}
