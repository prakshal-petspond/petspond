import { BadRequestException } from '@nestjs/common';
import { OtpSender } from './otp-sender.interface';

const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

export interface Fast2SmsOtpSenderOptions {
  apiKey: string;
  /** Default country code for normalizing 10-digit numbers (e.g. "91" for India). */
  defaultCountryCode?: string;
}

function normalizeMobile(mobile: string, defaultCountryCode = '91'): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return `${defaultCountryCode}${digits}`.replace(/\D/g, '').slice(-10);
}

function toUserMessage(raw: string): string {
  const s = String(raw || '');
  if (/website verification|DLT SMS API|complete.*verification/i.test(s)) {
    return 'OTP service not ready. Complete website verification in Fast2SMS dashboard (OTP Message menu) or contact support.';
  }
  return s || 'Unable to send SMS. Please try again later.';
}

/**
 * Sends OTP via Fast2SMS API (India). Use OTP_PROVIDER=fast2sms and set FAST2SMS_API_KEY.
 * Throws BadRequestException with user-friendly message on API errors.
 */
export class Fast2SmsOtpSender implements OtpSender {
  private readonly apiKey: string;
  private readonly defaultCountryCode: string;

  constructor(options: Fast2SmsOtpSenderOptions) {
    this.apiKey = options.apiKey;
    this.defaultCountryCode = options.defaultCountryCode ?? '91';
  }

  async send(mobile: string, otp: string, options?: { countryCode?: string }): Promise<void> {
    const numbers = normalizeMobile(mobile, options?.countryCode ?? this.defaultCountryCode);
    if (numbers.length < 10) {
      throw new BadRequestException('Invalid mobile number. Please check and try again.');
    }
    try {
      const params = new URLSearchParams({
        authorization: this.apiKey,
        route: 'otp',
        variables_values: otp,
        numbers: numbers,
        flash: '0',
      });
      const res = await fetch(`${FAST2SMS_URL}?${params.toString()}`, {
        method: 'GET',
      });
      const data = (await res.json().catch(() => ({}))) as {
        return?: boolean;
        message?: string | string[];
        request_id?: string;
      };
      if (!res.ok) {
        const message =
          Array.isArray(data.message) ? data.message[0] : data.message ?? res.statusText;
        throw new BadRequestException(toUserMessage(String(message)));
      }
      if (data.return === false) {
        const rawMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Failed to send SMS';
        throw new BadRequestException(toUserMessage(rawMsg));
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      const message = err instanceof Error ? err.message : 'Unable to send SMS. Please try again later.';
      throw new BadRequestException(toUserMessage(message));
    }
  }
}
