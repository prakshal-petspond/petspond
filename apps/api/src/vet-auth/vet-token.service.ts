import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';

export type VetTokenPair = {
  accessToken: string;
  refreshToken: string;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class VetTokenService {
  private readonly accessExpiresInSeconds: number;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.accessExpiresInSeconds = Number(
      config.get<string>('VET_ACCESS_TOKEN_EXPIRES_SECONDS') ?? '900',
    );
    const refreshDays = Number(config.get<string>('VET_REFRESH_TOKEN_EXPIRES_DAYS') ?? '30');
    this.refreshTtlMs = refreshDays * 24 * 60 * 60 * 1000;
  }

  signAccessToken(vetId: string): string {
    return this.jwtService.sign(
      { sub: vetId, type: 'access' },
      { expiresIn: this.accessExpiresInSeconds },
    );
  }

  async createTokenPair(vetId: string): Promise<VetTokenPair> {
    const accessToken = this.signAccessToken(vetId);
    const refreshToken = randomBytes(48).toString('base64url');
    const familyId = randomBytes(16).toString('hex');

    await this.prisma.vetRefreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        vetId,
        familyId,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });

    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(refreshToken: string): Promise<{ vetId: string } & VetTokenPair> {
    const tokenHash = hashToken(refreshToken);
    const existing = await this.prisma.vetRefreshToken.findUnique({ where: { tokenHash } });

    if (!existing || existing.revokedAt || existing.expiresAt.getTime() < Date.now()) {
      if (existing?.revokedAt) {
        await this.revokeFamily(existing.familyId);
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.vetRefreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = this.signAccessToken(existing.vetId);
    const newRefreshToken = randomBytes(48).toString('base64url');

    await this.prisma.vetRefreshToken.create({
      data: {
        tokenHash: hashToken(newRefreshToken),
        vetId: existing.vetId,
        familyId: existing.familyId,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });

    return {
      vetId: existing.vetId,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.vetRefreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForVet(vetId: string): Promise<void> {
    await this.prisma.vetRefreshToken.updateMany({
      where: { vetId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.vetRefreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
