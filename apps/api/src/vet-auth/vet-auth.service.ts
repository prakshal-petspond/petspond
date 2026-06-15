import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcryptjs';
import { getAndDeleteOtp } from '../auth/otp.store';
import { getAndDeleteOtpForKey, setOtpForKey } from '../auth/key-otp.store';
import { createRegistrationToken, consumeRegistrationToken } from '../auth/registration-token.store';
import { shouldAcceptOtpBypass } from '../auth/otp-bypass';
import type {
  Clinic,
  ClinicTeamResponse,
  Vet,
  VetCompleteClinicSetupDto,
  VetPendingClinicInvite,
  VetVerifyOtpResponse,
} from '@petspond/types';
import type { CreateClinicDto } from '@petspond/types';
import { VetsService } from '@/vets/vets.service';
import { ClinicsService } from '@/clinics/clinics.service';
import { AuthService } from '@/auth/auth.service';
import { EmailService } from '@/auth/email.service';
import { ClinicInvitesService } from '@/bookings/clinic-invites.service';
import { ClinicStaffService } from '@/clinic-staff/clinic-staff.service';
import { VetTokenService } from './vet-token.service';

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function emailOtpKey(email: string): string {
  return `email:${normalizeEmail(email)}`;
}

function onboardingPhoneKey(vetId: string, mobile: string): string {
  return `vet-phone:${vetId}:${normalizeMobile(mobile)}`;
}

@Injectable()
export class VetAuthService {
  private googleClient: OAuth2Client | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly vetsService: VetsService,
    private readonly clinicsService: ClinicsService,
    private readonly clinicInvites: ClinicInvitesService,
    private readonly clinicStaff: ClinicStaffService,
    private readonly vetTokens: VetTokenService,
  ) {}

  private getGoogleClient(): OAuth2Client {
    if (!this.googleClient) {
      const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
      if (!clientId) throw new BadRequestException('Google sign-in is not configured');
      this.googleClient = new OAuth2Client(clientId);
    }
    return this.googleClient;
  }

  private async authResponse(vet: Vet) {
    const { accessToken, refreshToken } = await this.vetTokens.createTokenPair(vet.id);
    const pendingClinicInvite = await this.getPendingClinicInvite(vet);
    return {
      accessToken,
      refreshToken,
      token: accessToken,
      vet,
      ...(pendingClinicInvite && { pendingClinicInvite }),
    };
  }

  async refreshSession(refreshToken: string) {
    const rotated = await this.vetTokens.rotateRefreshToken(refreshToken);
    const vet = await this.vetsService.findById(rotated.vetId);
    if (!vet) throw new UnauthorizedException('Vet not found');
    return {
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      token: rotated.accessToken,
    };
  }

  async logout(refreshToken: string) {
    await this.vetTokens.revokeRefreshToken(refreshToken);
    return { success: true };
  }

  async logoutAll(vetId: string) {
    await this.vetTokens.revokeAllForVet(vetId);
    return { success: true };
  }

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

  async verifyOtp(mobile: string, otp: string): Promise<VetVerifyOtpResponse> {
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
    const { accessToken, refreshToken } = await this.vetTokens.createTokenPair(vet.id);
    const pendingClinicInvite = await this.getPendingClinicInvite(vet);
    return {
      verified: true,
      accessToken,
      refreshToken,
      token: accessToken,
      vet,
      ...(pendingClinicInvite && { pendingClinicInvite }),
    };
  }

  async loginWithEmail(email: string, password: string) {
    const vet = await this.vetsService.findByEmail(normalizeEmail(email));
    if (!vet) throw new UnauthorizedException('Invalid email or password');

    const hash = await this.vetsService.getPasswordHash(vet.id);
    if (!hash) throw new UnauthorizedException('This account uses Google sign-in');

    const ok = await bcrypt.compare(password, hash);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    return this.authResponse(vet);
  }

  async sendRegisterEmailOtp(email: string) {
    const normalized = normalizeEmail(email);
    const existing = await this.vetsService.findByEmail(normalized);
    if (existing) throw new BadRequestException('An account with this email already exists');

    const otp = this.emailService.generateOtp();
    setOtpForKey(emailOtpKey(normalized), otp);
    const result = await this.emailService.sendOtp(normalized, otp);
    if (!result.success) {
      throw new BadRequestException(result.message ?? 'Failed to send verification email');
    }
    return result;
  }

  async verifyRegisterEmailOtp(email: string, otp: string) {
    const normalized = normalizeEmail(email);
    const existing = await this.vetsService.findByEmail(normalized);
    if (existing) throw new BadRequestException('An account with this email already exists');

    if (!shouldAcceptOtpBypass(this.config, otp)) {
      const stored = getAndDeleteOtpForKey(emailOtpKey(normalized));
      if (!stored) throw new BadRequestException('OTP expired or not found. Please request a new one.');
      if (stored !== otp.trim()) throw new BadRequestException('Invalid OTP.');
    }

    const registrationToken = createRegistrationToken(normalized);
    return { verified: true, registrationToken, email: normalized };
  }

  async completeRegistration(registrationToken: string, password: string) {
    const email = consumeRegistrationToken(registrationToken);
    if (!email) throw new BadRequestException('Registration session expired. Please start again.');

    const passwordHash = await bcrypt.hash(password, 12);
    const vet = await this.vetsService.createFromEmailRegistration(email, passwordHash);
    return this.authResponse(vet);
  }

  async loginWithGoogle(idToken: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) throw new BadRequestException('Google sign-in is not configured');

    const ticket = await this.getGoogleClient().verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const vet = await this.vetsService.createFromGoogle({
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name ?? 'Vet',
    });

    return this.authResponse(vet);
  }

  async sendOnboardingPhoneOtp(vetId: string, mobile: string) {
    const normalized = normalizeMobile(mobile);
    if (normalized.length < 10) throw new BadRequestException('Invalid mobile number');

    const conflict = await this.vetsService.findByMobile(normalized);
    if (conflict && conflict.id !== vetId && conflict.phoneVerified) {
      throw new BadRequestException('This mobile number is already registered');
    }

    return this.authService.sendOtp(normalized);
  }

  async verifyOnboardingPhoneOtp(vetId: string, mobile: string, otp: string) {
    const normalized = normalizeMobile(mobile);
    if (normalized.length < 10) throw new BadRequestException('Invalid mobile number');

    if (!shouldAcceptOtpBypass(this.config, otp)) {
      const stored = getAndDeleteOtp(normalized);
      if (!stored) throw new BadRequestException('OTP expired or not found. Please request a new one.');
      if (stored !== otp.trim()) throw new BadRequestException('Invalid OTP.');
    }

    const vet = await this.vetsService.verifyPhone(vetId, normalized);
    return vet;
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
    if (!existing.phoneVerified) {
      throw new BadRequestException('Please verify your phone number before completing setup');
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
