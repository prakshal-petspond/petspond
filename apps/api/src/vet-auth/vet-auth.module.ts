import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '@/auth/auth.module';
import { VetsModule } from '@/vets/vets.module';
import { ClinicsModule } from '@/clinics/clinics.module';
import { VetAuthController } from './vet-auth.controller';
import { VetAuthService } from './vet-auth.service';
import { VetJwtStrategy } from './vet-jwt.strategy';

@Module({
  imports: [
    AuthModule,
    VetsModule,
    ClinicsModule,
    PassportModule.register({ defaultStrategy: 'vet-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-production',
        signOptions: { expiresIn: 30 * 24 * 60 * 60 },
      }),
    }),
  ],
  controllers: [VetAuthController],
  providers: [VetAuthService, VetJwtStrategy],
  exports: [VetAuthService, VetJwtStrategy],
})
export class VetAuthModule {}
