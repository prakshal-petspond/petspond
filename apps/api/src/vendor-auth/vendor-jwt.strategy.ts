import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Vendor } from '@petspond/types';
import { VendorsService } from '@/vendors/vendors.service';

export interface VendorJwtPayload {
  sub: string;
  kind?: string;
}

@Injectable()
export class VendorJwtStrategy extends PassportStrategy(Strategy, 'vendor-jwt') {
  constructor(
    config: ConfigService,
    private readonly vendorsService: VendorsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-production',
    });
  }

  async validate(payload: VendorJwtPayload): Promise<Vendor> {
    if (payload.kind && payload.kind !== 'vendor') {
      throw new UnauthorizedException('Invalid token');
    }
    const vendor = await this.vendorsService.findById(payload.sub);
    if (!vendor) throw new UnauthorizedException('Vendor not found');
    return vendor;
  }
}
