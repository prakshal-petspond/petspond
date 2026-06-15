import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Vet } from '@petspond/types';
import { VetsService } from '@/vets/vets.service';

export interface VetJwtPayload {
  sub: string;
  type?: 'access';
}

@Injectable()
export class VetJwtStrategy extends PassportStrategy(Strategy, 'vet-jwt') {
  constructor(
    config: ConfigService,
    private readonly vetsService: VetsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-production',
    });
  }

  async validate(payload: VetJwtPayload): Promise<Vet> {
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    const vet = await this.vetsService.findById(payload.sub);
    if (!vet) throw new UnauthorizedException('Vet not found');
    return vet;
  }
}
