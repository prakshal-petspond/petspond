import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { VetRefreshTokenDocument } from './vet-refresh-token.schema';

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
    @InjectModel(VetRefreshTokenDocument.name)
    private readonly refreshModel: Model<VetRefreshTokenDocument>,
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

    await this.refreshModel.create({
      tokenHash: hashToken(refreshToken),
      vetId,
      familyId,
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
    });

    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(refreshToken: string): Promise<{ vetId: string } & VetTokenPair> {
    const tokenHash = hashToken(refreshToken);
    const existing = await this.refreshModel.findOne({ tokenHash }).exec();

    if (!existing || existing.revokedAt || existing.expiresAt.getTime() < Date.now()) {
      if (existing?.revokedAt) {
        await this.revokeFamily(existing.familyId);
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    existing.revokedAt = new Date();
    await existing.save();

    const accessToken = this.signAccessToken(existing.vetId);
    const newRefreshToken = randomBytes(48).toString('base64url');

    await this.refreshModel.create({
      tokenHash: hashToken(newRefreshToken),
      vetId: existing.vetId,
      familyId: existing.familyId,
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
    });

    return {
      vetId: existing.vetId,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.refreshModel
      .updateOne({ tokenHash }, { $set: { revokedAt: new Date() } })
      .exec();
  }

  async revokeAllForVet(vetId: string): Promise<void> {
    await this.refreshModel
      .updateMany({ vetId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } })
      .exec();
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.refreshModel
      .updateMany({ familyId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } })
      .exec();
  }
}
