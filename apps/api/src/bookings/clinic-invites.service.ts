import { BadRequestException, Injectable } from '@nestjs/common';
import type { ClinicInvite as ClinicInviteRow } from '@prisma/client';
import type { ClinicInviteDto } from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

function toDto(row: ClinicInviteRow): ClinicInviteDto {
  return {
    id: row.id,
    clinicId: row.clinicId,
    mobile: row.mobile,
    createdAt: row.createdAt.toISOString(),
    createdByVetId: row.createdByVetId,
  };
}

@Injectable()
export class ClinicInvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvite(clinicId: string, mobileRaw: string, createdByVetId: string): Promise<ClinicInviteDto> {
    const mobile = normalizeMobile(mobileRaw);
    if (mobile.length !== 10) {
      throw new BadRequestException('Enter a valid 10-digit mobile number');
    }
    try {
      const row = await this.prisma.clinicInvite.create({
        data: { clinicId, mobile, createdByVetId },
      });
      return toDto(row);
    } catch {
      throw new BadRequestException('This number is already invited to your clinic');
    }
  }

  async listForClinic(clinicId: string): Promise<ClinicInviteDto[]> {
    const rows = await this.prisma.clinicInvite.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  }

  /** Returns clinicId if an invite exists for this mobile (does not consume). */
  async findPendingMobile(mobileRaw: string): Promise<string | null> {
    const mobile = normalizeMobile(mobileRaw);
    const row = await this.prisma.clinicInvite.findFirst({ where: { mobile } });
    return row ? row.clinicId : null;
  }

  /** Returns clinicId if an invite existed and was consumed, else null */
  async consumePendingMobile(mobileRaw: string): Promise<string | null> {
    const mobile = normalizeMobile(mobileRaw);
    const row = await this.prisma.clinicInvite.findFirst({ where: { mobile } });
    if (!row) return null;
    await this.prisma.clinicInvite.delete({ where: { id: row.id } });
    return row.clinicId;
  }
}
