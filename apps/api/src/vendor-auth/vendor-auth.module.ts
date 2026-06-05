import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '@/auth/auth.module';
import { VendorsModule } from '@/vendors/vendors.module';
import { UploadsModule } from '@/uploads/uploads.module';
import { VendorAuthController } from './vendor-auth.controller';
import { VendorAuthService } from './vendor-auth.service';
import { VendorJwtStrategy } from './vendor-jwt.strategy';
import { VendorJwtAuthGuard } from './vendor-jwt-auth.guard';

@Module({
  imports: [
    AuthModule,
    VendorsModule,
    UploadsModule,
    PassportModule.register({ defaultStrategy: 'vendor-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-production',
        signOptions: { expiresIn: 30 * 24 * 60 * 60 },
      }),
    }),
  ],
  controllers: [VendorAuthController],
  providers: [VendorAuthService, VendorJwtStrategy, VendorJwtAuthGuard],
  exports: [VendorAuthService, VendorJwtAuthGuard],
})
export class VendorAuthModule {}
