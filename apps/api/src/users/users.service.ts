import { Injectable } from '@nestjs/common';
import type { User as UserRow } from '@prisma/client';
import type { User } from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    email: row.email ?? undefined,
    city: row.city ?? undefined,
    pincode: row.pincode ?? undefined,
    referredBy: row.referredBy ?? undefined,
    onboardingCompleted: row.onboardingCompleted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByMobile(mobile: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { mobile } });
    return row ? toUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }

  async createOrFindByMobile(mobile: string): Promise<User> {
    const normalized = mobile.replace(/\D/g, '').slice(-10);
    let row = await this.prisma.user.findUnique({ where: { mobile: normalized } });
    if (!row) {
      row = await this.prisma.user.create({
        data: {
          name: 'User',
          mobile: normalized,
          onboardingCompleted: false,
        },
      });
    }
    return toUser(row);
  }

  async updateOnboarding(
    userId: string,
    data: { name?: string; email?: string; city?: string; pincode?: string },
  ): Promise<User> {
    try {
      const row = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name != null && { name: data.name }),
          ...(data.email != null && { email: data.email }),
          ...(data.city != null && { city: data.city }),
          ...(data.pincode != null && { pincode: data.pincode }),
          onboardingCompleted: true,
        },
      });
      return toUser(row);
    } catch {
      throw new Error('User not found');
    }
  }
}
