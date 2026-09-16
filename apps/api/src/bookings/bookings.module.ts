import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ClinicInvitesService } from './clinic-invites.service';
import { UserBookingsController } from './user-bookings.controller';
import { PetsModule } from '@/pets/pets.module';
import { ClinicsModule } from '@/clinics/clinics.module';
import { VetsModule } from '@/vets/vets.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [PetsModule, ClinicsModule, VetsModule, AuthModule],
  controllers: [UserBookingsController],
  providers: [BookingsService, ClinicInvitesService],
  exports: [BookingsService, ClinicInvitesService],
})
export class BookingsModule {}
