import { BadRequestException } from '@nestjs/common';
import { OtpSender } from './otp-sender.interface';

const MSG91_SEND_OTP_URL = 'https://api.msg91.com/api/sendotp.php';

export interface Msg91OtpSenderOptions {
  /** MSG91 auth key (from dashboard). */
  authKey: string;
  /** Default country code for normalizing 10-digit numbers (e.g. "91" for India). */
  defaultCountryCode?: string;
  /** Optional sender ID (defaults to MSG91 account sender). */
  sender?: string;
}

function normalizeMobile(mobile: string, defaultCountryCode = '91'): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length <= 10) return `${defaultCountryCode}${digits}`.replace(/\D/g, '');
  return digits;
}

function toUserMessage(raw: string): string {
  const s = String(raw || '');
  if (/template|DLT|invalid auth|auth key|whitelist|blacklist/i.test(s)) {
    return 'OTP service configuration issue. Check MSG91 dashboard (templates, auth key, IP whitelist) or use OTP_PROVIDER=mock.';
  }
  return s || 'Unable to send SMS. Please try again later.';
}

/**
 * Sends OTP via MSG91 SendOTP API. Use OTP_PROVIDER=msg91 and set MSG91_AUTH_KEY.
 * Throws BadRequestException with user-friendly message on API errors.
 */
export class Msg91OtpSender implements OtpSender {
  private readonly authKey: string;
  private readonly defaultCountryCode: string;
  private readonly sender: string | undefined;

  constructor(options: Msg91OtpSenderOptions) {
    this.authKey = options.authKey;
    this.defaultCountryCode = options.defaultCountryCode ?? '91';
    this.sender = options.sender;
  }

  async send(mobile: string, otp: string, options?: { countryCode?: string }): Promise<void> {
    const countryCode = options?.countryCode ?? this.defaultCountryCode;
    const fullMobile = normalizeMobile(mobile, countryCode);
    if (fullMobile.length < 10) {
      throw new BadRequestException('Invalid mobile number. Please check and try again.');
    }
    try {
      const params = new URLSearchParams({
        authkey: this.authKey,
        mobile: fullMobile,
        otp,
      });
      if (this.sender) params.set('sender', this.sender);
      const res = await fetch(`${MSG91_SEND_OTP_URL}?${params.toString()}`, { method: 'GET' });
      const data = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
      if (!res.ok) {
        throw new BadRequestException(toUserMessage(data.message ?? res.statusText));
      }
      if (data.type !== 'success') {
        throw new BadRequestException(toUserMessage(data.message ?? 'Failed to send OTP'));
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      const message =
        err instanceof Error ? err.message : 'Unable to send SMS. Please try again later.';
      throw new BadRequestException(toUserMessage(message));
    }
  }
}
