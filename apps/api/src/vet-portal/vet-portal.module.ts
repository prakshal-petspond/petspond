import { Module } from '@nestjs/common';
import { VetAuthModule } from '@/vet-auth/vet-auth.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { ClinicsModule } from '@/clinics/clinics.module';
import { VetsModule } from '@/vets/vets.module';
import { VetClinicController } from './vet-clinic.controller';
import { VetBookingsController } from './vet-bookings.controller';
import { VetScheduleController } from './vet-schedule.controller';
import { VetFrontDeskController } from './vet-front-desk.controller';
import { ApprovedVetGuard } from './approved-vet.guard';
import { FrontDeskService } from './front-desk.service';

@Module({
  imports: [VetAuthModule, BookingsModule, ClinicsModule, VetsModule],
  controllers: [
    VetClinicController,
    VetBookingsController,
    VetScheduleController,
    VetFrontDeskController,
  ],
  providers: [ApprovedVetGuard, FrontDeskService],
})
export class VetPortalModule {}
