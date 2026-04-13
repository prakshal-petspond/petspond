import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsultationBookingDocument, ConsultationBookingSchema } from './consultation-booking.schema';
import { VaccinationBookingDocument, VaccinationBookingSchema } from './vaccination-booking.schema';
import { ClinicInviteDocument, ClinicInviteSchema } from './clinic-invite.schema';
import { BookingsService } from './bookings.service';
import { ClinicInvitesService } from './clinic-invites.service';
import { UserBookingsController } from './user-bookings.controller';
import { PetsModule } from '@/pets/pets.module';
import { ClinicsModule } from '@/clinics/clinics.module';
import { VetsModule } from '@/vets/vets.module';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConsultationBookingDocument.name, schema: ConsultationBookingSchema },
      { name: VaccinationBookingDocument.name, schema: VaccinationBookingSchema },
      { name: ClinicInviteDocument.name, schema: ClinicInviteSchema },
    ]),
    PetsModule,
    ClinicsModule,
    VetsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [UserBookingsController],
  providers: [BookingsService, ClinicInvitesService],
  exports: [BookingsService, ClinicInvitesService],
})
export class BookingsModule {}
