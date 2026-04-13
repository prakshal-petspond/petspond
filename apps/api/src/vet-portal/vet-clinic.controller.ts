import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VetJwtAuthGuard } from '@/vet-auth/vet-jwt-auth.guard';
import { CurrentVet } from '@/vet-auth/current-vet.decorator';
import type { Vet } from '@petspond/types';
import { ApprovedVetGuard } from './approved-vet.guard';
import { ClinicsService } from '@/clinics/clinics.service';
import { ClinicInvitesService } from '@/bookings/clinic-invites.service';
import { InviteDoctorBodyDto, UpdateClinicBodyDto } from './dto/vet-clinic.dto';

@Controller('vet/clinic')
@UseGuards(VetJwtAuthGuard, ApprovedVetGuard)
export class VetClinicController {
  constructor(
    private readonly clinics: ClinicsService,
    private readonly invites: ClinicInvitesService,
  ) {}

  @Get()
  async getMine(@CurrentVet() vet: Vet) {
    if (!vet.clinicId) throw new NotFoundException('No clinic linked');
    const clinic = await this.clinics.findById(vet.clinicId);
    if (!clinic) throw new NotFoundException('Clinic not found');
    return { clinic, vet };
  }

  @Patch()
  async updateMine(@CurrentVet() vet: Vet, @Body() body: UpdateClinicBodyDto) {
    if (!vet.clinicId) throw new ForbiddenException('No clinic');
    if (!vet.isClinicAdmin) {
      throw new ForbiddenException('Only the clinic admin can update clinic profile');
    }
    return this.clinics.updateById(vet.clinicId, body);
  }

  @Get('invites')
  listInvites(@CurrentVet() vet: Vet) {
    if (!vet.clinicId || !vet.isClinicAdmin) {
      throw new ForbiddenException('Only the clinic admin can view invites');
    }
    return this.invites.listForClinic(vet.clinicId);
  }

  @Post('invites')
  inviteDoctor(@CurrentVet() vet: Vet, @Body() body: InviteDoctorBodyDto) {
    if (!vet.clinicId || !vet.isClinicAdmin) {
      throw new ForbiddenException('Only the clinic admin can invite doctors');
    }
    return this.invites.createInvite(vet.clinicId, body.mobile, vet.id);
  }
}
