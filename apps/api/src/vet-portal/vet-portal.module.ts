import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VetAuthModule } from '@/vet-auth/vet-auth.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { ClinicsModule } from '@/clinics/clinics.module';
import { VetsModule } from '@/vets/vets.module';
import {
  ConsultationBookingDocument,
  ConsultationBookingSchema,
} from '@/bookings/consultation-booking.schema';
import { VetClinicController } from './vet-clinic.controller';
import { VetBookingsController } from './vet-bookings.controller';
import { VetScheduleController } from './vet-schedule.controller';
import { VetFrontDeskController } from './vet-front-desk.controller';
import { ApprovedVetGuard } from './approved-vet.guard';
import { FrontDeskService } from './front-desk.service';

@Module({
  imports: [
    VetAuthModule,
    BookingsModule,
    ClinicsModule,
    VetsModule,
    MongooseModule.forFeature([
      { name: ConsultationBookingDocument.name, schema: ConsultationBookingSchema },
    ]),
  ],
  controllers: [
    VetClinicController,
    VetBookingsController,
    VetScheduleController,
    VetFrontDeskController,
  ],
  providers: [ApprovedVetGuard, FrontDeskService],
})
export class VetPortalModule {}
