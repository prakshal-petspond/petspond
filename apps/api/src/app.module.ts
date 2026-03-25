import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { VetAuthModule } from './vet-auth/vet-auth.module';
import { ClinicsModule } from './clinics/clinics.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/petspond', {
      retryWrites: true,
    }),
    HealthModule,
    AuthModule,
    VetAuthModule,
    ClinicsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
