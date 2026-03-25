import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getAndDeleteOtp } from '../auth/otp.store';
import { canSendOtp, getCooldownSeconds, recordOtpSent } from '../auth/otp-rate-limit';
import type { Vet } from '@petspond/types';
import type { CreateClinicDto } from '@petspond/types';
import { VetsService } from '@/vets/vets.service';
import { ClinicsService } from '@/clinics/clinics.service';
import { AuthService } from '@/auth/auth.service';

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

@Injectable()
export class VetAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly vetsService: VetsService,
    private readonly clinicsService: ClinicsService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(mobile: string, countryCode?: string): Promise<{ success: boolean; message?: string }> {
    return this.authService.sendOtp(mobile, countryCode);
  }

  async verifyOtp(
    mobile: string,
    otp: string,
  ): Promise<{ verified: boolean; token?: string; vet?: Vet; message?: string }> {
    const normalized = normalizeMobile(mobile);
    const stored = getAndDeleteOtp(normalized);
    if (!stored) {
      return { verified: false, message: 'OTP expired or not found. Please request a new one.' };
    }
    if (stored !== otp.trim()) {
      return { verified: false, message: 'Invalid OTP.' };
    }
    const vet = await this.vetsService.createOrFindByMobile(normalized);
    const token = this.jwtService.sign({ sub: vet.id });
    return { verified: true, token, vet };
  }

  async completeOnboarding(
    vetId: string,
    data: {
      fullName: string;
      email?: string;
      veterinaryRegistrationNumber: string;
      yearOfRegistration: number;
      qualifications: string[];
      specializations: string[];
      clinicId?: string;
      newClinic?: CreateClinicDto;
    },
  ): Promise<Vet> {
    let clinicId = data.clinicId;
    let isClinicAdmin = false;
    let approvalStatus: 'pending' | 'approved' = 'pending';

    if (data.newClinic) {
      const clinic = await this.clinicsService.create({
        ...data.newClinic,
        adminVetId: vetId,
      });
      clinicId = clinic.id;
      isClinicAdmin = true;
      approvalStatus = 'approved';
    } else if (data.clinicId) {
      approvalStatus = 'pending';
    }

    return this.vetsService.updateOnboarding(vetId, {
      fullName: data.fullName,
      email: data.email,
      veterinaryRegistrationNumber: data.veterinaryRegistrationNumber,
      yearOfRegistration: data.yearOfRegistration,
      qualifications: data.qualifications,
      specializations: data.specializations,
      clinicId,
      isClinicAdmin,
      approvalStatus,
    });
  }
}
