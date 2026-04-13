// Twilio is CJS; default import can be undefined at runtime. Use namespace and fallback.
import * as TwilioModule from 'twilio';
import { BadRequestException } from '@nestjs/common';
import { OtpSender } from './otp-sender.interface';

const twilio = (TwilioModule as unknown as { default?: typeof TwilioModule }).default ?? TwilioModule;

/**
 * Format mobile to E.164. Assumes Indian (+91) if 10 digits; otherwise prepend +.
 */
export function toE164(mobile: string, defaultCountryCode = '91'): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10 && defaultCountryCode) {
    return `+${defaultCountryCode}${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return `+${defaultCountryCode}${digits}`;
}

/** Twilio error codes we map to user-friendly messages */
const TWILIO_ERROR_MESSAGES: Record<number, string> = {
  20003: 'SMS authentication failed. Check Twilio Account SID and Auth Token on the server.',
  21211: 'Invalid mobile number. Please check and try again.',
  21408: 'SMS is not supported for this region.',
  21604: 'Invalid destination number. Check the mobile number and country code.',
  21606: 'SMS service is not configured for this number. Please try again later.',
  21608: 'Trial accounts can only send to verified numbers. Add this number in Twilio Console or upgrade your account.',
  21610: 'This number is blocked or cannot receive SMS from this sender.',
  21614: 'Invalid mobile number. Please check and try again.',
  21617: 'Invalid mobile number format.',
};

export interface TwilioOtpSenderOptions {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  defaultCountryCode?: string;
}

/**
 * Sends OTP via Twilio SMS. Use OTP_PROVIDER=twilio and set TWILIO_* env vars.
 * Throws BadRequestException with user-friendly message on Twilio errors.
 */
export class TwilioOtpSender implements OtpSender {
  private readonly client: ReturnType<typeof twilio>;
  private readonly fromNumber: string;
  private readonly defaultCountryCode: string;

  constructor(options: TwilioOtpSenderOptions) {
    this.client = twilio(options.accountSid, options.authToken);
    this.fromNumber = options.fromNumber;
    this.defaultCountryCode = options.defaultCountryCode ?? '91';
  }

  async send(mobile: string, otp: string, options?: { countryCode?: string }): Promise<void> {
    const to = toE164(mobile, options?.countryCode ?? this.defaultCountryCode);
    try {
      await this.client.messages.create({
        body: `Your Petspond verification code is: ${otp}. Valid for 5 minutes.`,
        from: this.fromNumber,
        to,
      });
    } catch (err: unknown) {
      const twilioErr = err as { code?: number; message?: string; moreInfo?: string };
      const code = twilioErr?.code;
      // eslint-disable-next-line no-console
      console.error('[Twilio OTP] Send failed', {
        code,
        message: twilioErr?.message,
        moreInfo: twilioErr?.moreInfo,
      });
      const message =
        (typeof code === 'number' && TWILIO_ERROR_MESSAGES[code]) ||
        'Unable to send SMS. Please try again later.';
      throw new BadRequestException(message);
    }
  }
}
