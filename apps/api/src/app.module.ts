import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { VetAuthModule } from './vet-auth/vet-auth.module';
import { ClinicsModule } from './clinics/clinics.module';
import { PaymentsModule } from './payments/payments.module';
import { PetsModule } from './pets/pets.module';
import { BookingsModule } from './bookings/bookings.module';
import { CatalogModule } from './catalog/catalog.module';
import { VetPortalModule } from './vet-portal/vet-portal.module';
import { VendorsModule } from './vendors/vendors.module';
import { VendorAuthModule } from './vendor-auth/vendor-auth.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    PrismaModule,
    HealthModule,
    AuthModule,
    VetAuthModule,
    ClinicsModule,
    PaymentsModule,
    PetsModule,
    VendorsModule,
    VendorAuthModule,
    UploadsModule,
    BookingsModule,
    CatalogModule,
    VetPortalModule,
  ],
})
export class AppModule {}
