import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { VetJwtAuthGuard } from '@/vet-auth/vet-jwt-auth.guard';
import { CurrentVet } from '@/vet-auth/current-vet.decorator';
import type { Vet } from '@petspond/types';
import { ApprovedVetGuard } from './approved-vet.guard';
import { VetsService } from '@/vets/vets.service';
import { UpdateWeeklyScheduleDto } from './dto/vet-schedule.dto';

@Controller('vet/schedule')
@UseGuards(VetJwtAuthGuard, ApprovedVetGuard)
export class VetScheduleController {
  constructor(private readonly vets: VetsService) {}

  @Get()
  async getMine(@CurrentVet() vet: Vet) {
    const fresh = await this.vets.findById(vet.id);
    if (!fresh) throw new NotFoundException('Vet not found');
    return { weeklyAvailability: fresh.weeklyAvailability ?? [] };
  }

  @Patch()
  async updateMine(@CurrentVet() vet: Vet, @Body() body: UpdateWeeklyScheduleDto) {
    if (!vet.clinicId) {
      throw new ForbiddenException('Join a clinic before setting your weekly hours');
    }
    return this.vets.setWeeklyAvailability(vet.id, body.weeklyAvailability);
  }

  /** Clinic admins: view all approved doctors' recurring schedules (read-only coordination). */
  @Get('team')
  async team(@CurrentVet() vet: Vet) {
    if (!vet.clinicId || !vet.isClinicAdmin) {
      throw new ForbiddenException('Only the clinic admin can view the team schedule');
    }
    return this.vets.listTeamSchedulesForClinic(vet.clinicId);
  }
}
