import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { VetJwtAuthGuard } from '@/vet-auth/vet-jwt-auth.guard';
import { CurrentVet } from '@/vet-auth/current-vet.decorator';
import type { Vet } from '@petspond/types';
import { ApprovedVetGuard } from './approved-vet.guard';
import { BookingsService } from '@/bookings/bookings.service';
import { PatchConsultationStatusDto, PatchVaccinationStatusDto } from '@/bookings/dto/vet-booking-patch.dto';

@Controller('vet/bookings')
@UseGuards(VetJwtAuthGuard, ApprovedVetGuard)
export class VetBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get('consultations')
  listConsultations(@CurrentVet() vet: Vet) {
    return this.bookings.listConsultationsForVet(vet);
  }

  @Patch('consultations/:id')
  patchConsultation(
    @CurrentVet() vet: Vet,
    @Param('id') id: string,
    @Body() body: PatchConsultationStatusDto,
  ) {
    return this.bookings.updateConsultationStatus(vet, id, body.status);
  }

  @Get('vaccinations')
  listVaccinations(@CurrentVet() vet: Vet) {
    return this.bookings.listVaccinationsForVet(vet);
  }

  @Patch('vaccinations/:id')
  patchVaccination(
    @CurrentVet() vet: Vet,
    @Param('id') id: string,
    @Body() body: PatchVaccinationStatusDto,
  ) {
    return this.bookings.updateVaccinationStatus(vet, id, body.status);
  }
}
