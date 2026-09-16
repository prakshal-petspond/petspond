import { Injectable } from '@nestjs/common';
import type { ClinicStaff as ClinicStaffRow } from '@prisma/client';
import type { ClinicStaffMember } from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';

function toStaff(row: ClinicStaffRow): ClinicStaffMember {
  return {
    id: row.id,
    clinicId: row.clinicId,
    role: 'front_office',
    fullName: row.fullName,
    ...(row.email && { email: row.email }),
    ...(row.mobile && { mobile: row.mobile }),
    createdByVetId: row.createdByVetId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
  constructor(private readonly prisma: PrismaService) {}

  async createMany(items: CreateClinicStaffInput[]): Promise<ClinicStaffMember[]> {
    if (!items.length) return [];
    const created = await this.prisma.$transaction(
      items.map((item) => {
        const mobileDigits = item.mobile?.replace(/\D/g, '').slice(-10);
        return this.prisma.clinicStaff.create({
          data: {
            clinicId: item.clinicId,
            role: 'front_office',
            fullName: item.fullName.trim(),
            ...(item.email?.trim() && { email: item.email.trim() }),
            ...(mobileDigits && { mobile: mobileDigits }),
            createdByVetId: item.createdByVetId,
          },
        });
      }),
    );
    return created.map(toStaff);
  }

  async findByClinicId(clinicId: string): Promise<ClinicStaffMember[]> {
    const rows = await this.prisma.clinicStaff.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toStaff);
  }
}
