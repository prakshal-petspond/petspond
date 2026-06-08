import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { VetAuthService } from './vet-auth.service';
import { VetJwtAuthGuard } from './vet-jwt-auth.guard';
import { CurrentVet } from './current-vet.decorator';
import type { Vet } from '@petspond/types';
import { SendOtpDto } from '@/auth/dto/send-otp.dto';
import { VetVerifyOtpDto } from './dto/verify-otp.dto';
import { VetCompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { VetCompleteClinicSetupDto } from './dto/complete-clinic-setup.dto';
import { VetsService } from '@/vets/vets.service';
import { ClinicsService } from '@/clinics/clinics.service';
import { R2StorageService } from '@/storage/r2-storage.service';
import { imageUploadInterceptor } from '@/uploads/image-upload.interceptor';

@Controller('vet-auth')
export class VetAuthController {
  constructor(
    private readonly vetAuthService: VetAuthService,
    private readonly vetsService: VetsService,
    private readonly clinicsService: ClinicsService,
    private readonly storage: R2StorageService,
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

  @Get('pending-clinic-invite')
  @UseGuards(VetJwtAuthGuard)
  async pendingClinicInvite(@CurrentVet() vet: Vet) {
    const invite = await this.vetAuthService.getPendingClinicInvite(vet);
    return invite ?? null;
  }

  @Post('accept-clinic-invite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(VetJwtAuthGuard)
  async acceptClinicInvite(@CurrentVet() vet: Vet) {
    return this.vetAuthService.acceptClinicInvite(vet.id, vet.mobile);
  }

  @Get('clinic/:clinicId/team')
  @UseGuards(VetJwtAuthGuard)
  async getTeam(@CurrentVet() vet: Vet, @Param('clinicId') clinicId: string) {
    if (vet.clinicId !== clinicId || !vet.isClinicAdmin) {
      throw new ForbiddenException('Only the clinic admin can view the team');
    }
    return this.vetAuthService.getClinicTeam(clinicId);
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

  @Post('complete-clinic-setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(VetJwtAuthGuard)
  async completeClinicSetup(@CurrentVet() vet: Vet, @Body() dto: VetCompleteClinicSetupDto) {
    return this.vetAuthService.completeClinicSetup(vet.id, dto);
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

  @Post('upload-photo')
  @UseGuards(VetJwtAuthGuard)
  @UseInterceptors(imageUploadInterceptor)
  uploadPhoto(@CurrentVet() vet: Vet, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided');
    return this.storage.uploadImage(file, `vets/${vet.id}`);
  }
}
