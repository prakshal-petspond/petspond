import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { shouldAcceptOtpBypass } from './otp-bypass';
import { canSendOtp, getCooldownSeconds, recordOtpSent } from './otp-rate-limit';
import type { OtpSender } from './otp-sender.interface';
import { OTP_SENDER } from './auth.tokens';
import type { User } from '@petspond/types';
import { UsersService } from '@/users/users.service';
import { AuthChallengeService } from './auth-challenge.service';

const MOBILE_OTP_KIND = 'mobile_otp';

function generateOtp(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(OTP_SENDER) private readonly otpSender: OtpSender,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly challenges: AuthChallengeService,
  ) {}

  async sendOtp(mobile: string, countryCode?: string): Promise<{ success: boolean; message?: string }> {
    const normalized = normalizeMobile(mobile);
    if (normalized.length < 10) {
      throw new BadRequestException('Invalid mobile number');
    }
    if (!canSendOtp(normalized)) {
      throw new BadRequestException(
        `Please wait ${getCooldownSeconds()} seconds before requesting another code.`,
      );
    }
    const otp = generateOtp(6);
    await this.challenges.setOtp(MOBILE_OTP_KIND, normalized, otp);
    await this.otpSender.send(normalized, otp, { countryCode });
    recordOtpSent(normalized);
    const provider = this.config.get<string>('OTP_PROVIDER', 'mock');
    const masked = `***${normalized.slice(-4)}`;
    // eslint-disable-next-line no-console
    console.log(`[OTP] Sent to ${masked} via ${provider}`);
    if (provider === 'mock') {
      return { success: true, message: 'OTP sent. Check the API server console for the code (mock mode).' };
    }
    return { success: true, message: 'OTP sent' };
  }

  async verifyOtp(
    mobile: string,
    otp: string,
  ): Promise<{ verified: boolean; token?: string; user?: User; message?: string }> {
    const normalized = normalizeMobile(mobile);
    if (normalized.length < 10) {
      return { verified: false, message: 'Invalid mobile number.' };
    }
    if (shouldAcceptOtpBypass(this.config, otp)) {
      const user = await this.usersService.createOrFindByMobile(normalized);
      const token = this.jwtService.sign({ sub: user.id });
      return { verified: true, token, user };
    }
    const result = await this.challenges.consumeOtp(MOBILE_OTP_KIND, normalized, otp);
    if (result === 'missing') {
      return { verified: false, message: 'OTP expired or not found. Please request a new one.' };
    }
    if (result === 'mismatch') {
      return { verified: false, message: 'Invalid OTP.' };
    }
    const user = await this.usersService.createOrFindByMobile(normalized);
    const token = this.jwtService.sign({ sub: user.id });
    return { verified: true, token, user };
  }

  /** Verify mobile OTP without issuing a user JWT (shared by vet/vendor onboarding). */
  async verifyMobileOtpCode(mobile: string, otp: string): Promise<{ ok: boolean; message?: string }> {
    const normalized = normalizeMobile(mobile);
    if (normalized.length < 10) {
      return { ok: false, message: 'Invalid mobile number.' };
    }
    if (shouldAcceptOtpBypass(this.config, otp)) {
      return { ok: true };
    }
    const result = await this.challenges.consumeOtp(MOBILE_OTP_KIND, normalized, otp);
    if (result === 'ok') return { ok: true };
    if (result === 'mismatch') return { ok: false, message: 'Invalid OTP.' };
    return { ok: false, message: 'OTP expired or not found. Please request a new one.' };
  }

  async completeOnboarding(
    userId: string,
    data: { name: string; email?: string; city?: string; pincode?: string },
  ): Promise<User> {
    return this.usersService.updateOnboarding(userId, data);
  }
}
