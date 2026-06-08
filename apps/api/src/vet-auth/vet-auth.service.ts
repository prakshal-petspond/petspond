import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getAndDeleteOtp } from '../auth/otp.store';
import { shouldAcceptOtpBypass } from '../auth/otp-bypass';
import type { Clinic, ClinicTeamResponse, Vet, VetCompleteClinicSetupDto, VetPendingClinicInvite } from '@petspond/types';
import type { CreateClinicDto } from '@petspond/types';
import { VetsService } from '@/vets/vets.service';
import { ClinicsService } from '@/clinics/clinics.service';
import { AuthService } from '@/auth/auth.service';
import { ClinicInvitesService } from '@/bookings/clinic-invites.service';
import { ClinicStaffService } from '@/clinic-staff/clinic-staff.service';

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

@Injectable()
export class VetAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly vetsService: VetsService,
    private readonly clinicsService: ClinicsService,
    private readonly jwtService: JwtService,
    private readonly clinicInvites: ClinicInvitesService,
    private readonly clinicStaff: ClinicStaffService,
  ) {}

  /** Prefer existing mobile profile, then pre-added clinic vet via invite, else create stub. */
  private async resolveVetForLogin(normalized: string): Promise<Vet> {
    const existing = await this.vetsService.findByMobile(normalized);
    if (existing) return existing;

    const inviteClinicId = await this.clinicInvites.findPendingMobile(normalized);
    if (inviteClinicId) {
      const pending = await this.vetsService.findPendingClinicVeterinarian(inviteClinicId);
      if (pending) {
        return this.vetsService.assignMobileToVet(pending.id, normalized);
      }
    }

    return this.vetsService.createOrFindByMobile(normalized);
  }

  async sendOtp(mobile: string, countryCode?: string): Promise<{ success: boolean; message?: string }> {
    return this.authService.sendOtp(mobile, countryCode);
  }

  async verifyOtp(
    mobile: string,
    otp: string,
  ): Promise<{
    verified: boolean;
    token?: string;
    vet?: Vet;
    pendingClinicInvite?: VetPendingClinicInvite;
    message?: string;
  }> {
    const normalized = normalizeMobile(mobile);
    if (normalized.length < 10) {
      return { verified: false, message: 'Invalid mobile number.' };
    }
    let vet: Vet;
    if (shouldAcceptOtpBypass(this.config, otp)) {
      vet = await this.resolveVetForLogin(normalized);
    } else {
      const stored = getAndDeleteOtp(normalized);
      if (!stored) {
        return { verified: false, message: 'OTP expired or not found. Please request a new one.' };
      }
      if (stored !== otp.trim()) {
        return { verified: false, message: 'Invalid OTP.' };
      }
      vet = await this.resolveVetForLogin(normalized);
    }
    const token = this.jwtService.sign({ sub: vet.id });
    const pendingClinicInvite = await this.getPendingClinicInvite(vet);
    return { verified: true, token, vet, ...(pendingClinicInvite && { pendingClinicInvite }) };
  }

  async getPendingClinicInvite(vet: Vet): Promise<VetPendingClinicInvite | null> {
    if (vet.onboardingCompleted || vet.isClinicAdmin) return null;

    let clinicId = vet.clinicId;
    if (!clinicId) {
      clinicId = (await this.clinicInvites.findPendingMobile(vet.mobile)) ?? undefined;
    }
    if (!clinicId) return null;

    const clinic = await this.clinicsService.findById(clinicId);
    if (!clinic) return null;

    return {
      clinicId,
      clinicName: clinic.name?.trim() || 'Your clinic',
    };
  }

  async acceptClinicInvite(vetId: string, mobile: string): Promise<Vet> {
    const vet = await this.vetsService.findById(vetId);
    if (!vet) throw new BadRequestException('Vet not found');

    let clinicId = vet.clinicId;
    if (!clinicId) {
      clinicId = (await this.clinicInvites.consumePendingMobile(mobile)) ?? undefined;
    } else {
      await this.clinicInvites.consumePendingMobile(mobile);
    }

    if (vet.onboardingCompleted && vet.clinicId) {
      return vet;
    }

    if (!clinicId) {
      throw new BadRequestException('No pending clinic invitation');
    }

    const updated = await this.vetsService.acceptClinicMembership(vetId, clinicId);
    await this.clinicsService.syncDoctorCount(clinicId);
    return updated;
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
      photoUrl?: string;
      displayTitle?: string;
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
    } else {
      const vet = await this.vetsService.findById(vetId);
      if (vet) {
        const invitedClinicId = await this.clinicInvites.consumePendingMobile(vet.mobile);
        if (invitedClinicId) {
          clinicId = invitedClinicId;
          approvalStatus = 'pending';
          isClinicAdmin = false;
        }
      }
    }

    const updated = await this.vetsService.updateOnboarding(vetId, {
      fullName: data.fullName,
      email: data.email,
      veterinaryRegistrationNumber: data.veterinaryRegistrationNumber,
      yearOfRegistration: data.yearOfRegistration,
      qualifications: data.qualifications,
      specializations: data.specializations,
      clinicId,
      isClinicAdmin,
      approvalStatus,
      photoUrl: data.photoUrl,
      displayTitle: data.displayTitle,
    });

    if (updated.clinicId) {
      await this.clinicsService.syncDoctorCount(updated.clinicId);
    }

    return updated;
  }

  async completeClinicSetup(vetId: string, dto: VetCompleteClinicSetupDto): Promise<{ vet: Vet; clinic: Clinic }> {
    const existing = await this.vetsService.findById(vetId);
    if (!existing) throw new BadRequestException('Vet not found');
    if (existing.onboardingCompleted) {
      throw new BadRequestException('Onboarding already completed');
    }

    const additionalVets = dto.additionalVeterinarians ?? [];
    const frontStaff = dto.frontOfficeStaff ?? [];

    const clinic = await this.clinicsService.create({
      name: dto.clinicName.trim(),
      totalDoctors: 1 + additionalVets.length,
      address: dto.address.trim(),
      pincode: dto.pincode.trim(),
      city: dto.city?.trim(),
      state: dto.state?.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      placeId: dto.placeId,
      adminVetId: vetId,
      servicesOffered: dto.servicesOffered,
    });

    const updatedVet = await this.vetsService.updateOnboarding(vetId, {
      fullName: dto.fullName.trim(),
      email: dto.email?.trim(),
      veterinaryRegistrationNumber: 'PENDING',
      yearOfRegistration: new Date().getFullYear(),
      qualifications: [],
      specializations: [],
      clinicId: clinic.id,
      isClinicAdmin: true,
      approvalStatus: 'approved',
    });

    await this.vetsService.setWeeklyAvailability(vetId, dto.weeklyAvailability ?? []);

    for (const v of additionalVets) {
      await this.vetsService.createClinicVeterinarian({
        clinicId: clinic.id,
        fullName: v.fullName,
        email: v.email,
        mobile: v.mobile,
        veterinaryRegistrationNumber: v.veterinaryRegistrationNumber,
        specializations: v.specializations,
      });

      const mobile = v.mobile?.replace(/\D/g, '').slice(-10);
      if (mobile?.length === 10) {
        try {
          await this.clinicInvites.createInvite(clinic.id, mobile, vetId);
        } catch {
          // Invite may already exist — ignore during onboarding
        }
      }
    }

    if (frontStaff.length) {
      await this.clinicStaff.createMany(
        frontStaff.map((s) => ({
          clinicId: clinic.id,
          fullName: s.fullName,
          email: s.email,
          mobile: s.mobile,
          createdByVetId: vetId,
        })),
      );
    }

    await this.clinicsService.syncDoctorCount(clinic.id);

    return { vet: updatedVet, clinic };
  }

  async getClinicTeam(clinicId: string): Promise<ClinicTeamResponse> {
    const [veterinarians, frontOfficeStaff] = await Promise.all([
      this.vetsService.findByClinicId(clinicId),
      this.clinicStaff.findByClinicId(clinicId),
    ]);
    return { veterinarians, frontOfficeStaff };
  }
}
