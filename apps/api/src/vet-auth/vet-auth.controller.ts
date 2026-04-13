import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { VetAuthService } from './vet-auth.service';
import { VetJwtAuthGuard } from './vet-jwt-auth.guard';
import { CurrentVet } from './current-vet.decorator';
import type { Vet } from '@petspond/types';
import { SendOtpDto } from '@/auth/dto/send-otp.dto';
import { VetVerifyOtpDto } from './dto/verify-otp.dto';
import { VetCompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { VetsService } from '@/vets/vets.service';
import { ClinicsService } from '@/clinics/clinics.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@Controller('vet-auth')
export class VetAuthController {
  constructor(
    private readonly vetAuthService: VetAuthService,
    private readonly vetsService: VetsService,
    private readonly clinicsService: ClinicsService,
  ) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.vetAuthService.sendOtp(dto.mobile, dto.countryCode);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VetVerifyOtpDto) {
    try {
      return await this.vetAuthService.verifyOtp(dto.mobile, dto.otp);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(
        process.env.NODE_ENV === 'production' ? 'Verification failed. Please try again.' : message,
      );
    }
  }

  @Get('me')
  @UseGuards(VetJwtAuthGuard)
  async me(@CurrentVet() vet: Vet) {
    return vet;
  }

  @Get('clinic/:clinicId/team')
  @UseGuards(VetJwtAuthGuard)
  async getTeam(@CurrentVet() vet: Vet, @Param('clinicId') clinicId: string) {
    if (vet.clinicId !== clinicId || !vet.isClinicAdmin) {
      throw new ForbiddenException('Only the clinic admin can view the team');
    }
    return this.vetsService.findByClinicId(clinicId);
  }

  @Patch('vets/:id/approve')
  @UseGuards(VetJwtAuthGuard)
  async approveVet(@CurrentVet() admin: Vet, @Param('id') vetId: string) {
    const vet = await this.vetsService.findById(vetId);
    if (!vet) throw new NotFoundException('Vet not found');
    if (vet.clinicId !== admin.clinicId || !admin.isClinicAdmin) {
      throw new ForbiddenException('Only the clinic admin can approve doctors');
    }
    const updated = await this.vetsService.approve(vetId);
    if (updated.clinicId) {
      await this.clinicsService.syncDoctorCount(updated.clinicId);
    }
    return updated;
  }

  @Post('complete-onboarding')
  @HttpCode(HttpStatus.OK)
  @UseGuards(VetJwtAuthGuard)
  async completeOnboarding(
    @CurrentVet() vet: Vet,
    @Body() dto: VetCompleteOnboardingDto,
  ) {
    return this.vetAuthService.completeOnboarding(vet.id, {
      fullName: dto.fullName,
      email: dto.email,
      veterinaryRegistrationNumber: dto.veterinaryRegistrationNumber,
      yearOfRegistration: dto.yearOfRegistration,
      qualifications: dto.qualifications,
      specializations: dto.specializations,
      clinicId: dto.clinicId,
      newClinic: dto.newClinic,
      photoUrl: dto.photoUrl,
      displayTitle: dto.displayTitle,
    });
  }
}
