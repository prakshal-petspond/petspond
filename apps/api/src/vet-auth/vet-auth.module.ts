import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '@/auth/auth.module';
import { VetsModule } from '@/vets/vets.module';
import { ClinicsModule } from '@/clinics/clinics.module';
import { VetAuthController } from './vet-auth.controller';
import { VetAuthService } from './vet-auth.service';
import { VetJwtStrategy } from './vet-jwt.strategy';
import { VetJwtAuthGuard } from './vet-jwt-auth.guard';
import { BookingsModule } from '@/bookings/bookings.module';
import { UploadsModule } from '@/uploads/uploads.module';
import { ClinicStaffModule } from '@/clinic-staff/clinic-staff.module';
import { VetRefreshTokenDocument, VetRefreshTokenSchema } from './vet-refresh-token.schema';
import { VetTokenService } from './vet-token.service';

@Module({
  imports: [
    AuthModule,
    VetsModule,
    ClinicsModule,
    BookingsModule,
    UploadsModule,
    ClinicStaffModule,
    MongooseModule.forFeature([
      { name: VetRefreshTokenDocument.name, schema: VetRefreshTokenSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'vet-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-production',
        signOptions: {
          expiresIn: Number(config.get<string>('VET_ACCESS_TOKEN_EXPIRES_SECONDS') ?? '900'),
        },
      }),
    }),
  ],
  controllers: [VetAuthController],
  providers: [VetAuthService, VetTokenService, VetJwtStrategy, VetJwtAuthGuard],
  exports: [VetAuthService, VetTokenService, VetJwtStrategy, VetJwtAuthGuard],
})
export class VetAuthModule {}
