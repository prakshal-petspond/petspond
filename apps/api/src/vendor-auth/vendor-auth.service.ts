import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Vendor, VendorCompleteOnboardingDto, VendorUpdateProfileDto } from '@petspond/types';
import { AuthService } from '@/auth/auth.service';
import { shouldAcceptOtpBypass } from '@/auth/otp-bypass';
import { VendorsService } from '@/vendors/vendors.service';

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

@Injectable()
export class VendorAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly vendorsService: VendorsService,
    private readonly jwtService: JwtService,
  ) {}

  sendOtp(mobile: string, countryCode?: string) {
    return this.authService.sendOtp(mobile, countryCode);
  }

  async verifyOtp(
    mobile: string,
    otp: string,
  ): Promise<{ verified: boolean; token?: string; vendor?: Vendor; message?: string }> {
    const normalized = normalizeMobile(mobile);
    if (normalized.length < 10) {
      return { verified: false, message: 'Invalid mobile number.' };
    }
    if (!shouldAcceptOtpBypass(this.config, otp)) {
      const check = await this.authService.verifyMobileOtpCode(normalized, otp);
      if (!check.ok) {
        return { verified: false, message: check.message ?? 'Invalid OTP.' };
      }
    }
    const vendor = await this.vendorsService.createOrFindByMobile(normalized);
    const token = this.jwtService.sign({ sub: vendor.id, kind: 'vendor' });
    return { verified: true, token, vendor };
  }

  completeOnboarding(vendorId: string, dto: VendorCompleteOnboardingDto) {
    return this.vendorsService.completeOnboarding(vendorId, dto);
  }

  updateProfile(vendorId: string, dto: VendorUpdateProfileDto) {
    return this.vendorsService.updateProfile(vendorId, dto);
  }
}
