import type { ConfigService } from '@nestjs/config';

/**
 * Master OTP that skips the stored OTP check (user + vet login).
 * Enabled when OTP_BYPASS=true, or when OTP_BYPASS is unset and NODE_ENV !== 'production'.
 * Set OTP_BYPASS=false to turn off even in development.
 */
export function shouldAcceptOtpBypass(config: ConfigService, submittedOtp: string): boolean {
  const expected = (config.get<string>('OTP_BYPASS_CODE') ?? '123456').trim();
  if (submittedOtp.trim() !== expected) return false;

  const flag = config.get<string>('OTP_BYPASS');
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;

  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  return nodeEnv !== 'production';
}
