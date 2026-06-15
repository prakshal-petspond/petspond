import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.split('#')[0]?.trim() || undefined;
}

type EmailProvider = 'resend' | 'mock';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  private resolveProvider(): EmailProvider {
    const explicit = sanitizeEnv(this.config.get<string>('EMAIL_PROVIDER'))?.toLowerCase();
    if (explicit === 'mock') return 'mock';
    if (explicit === 'resend') return 'resend';
    if (sanitizeEnv(this.config.get<string>('RESEND_API_KEY'))) return 'resend';
    return 'mock';
  }

  private resolveFromAddress(): string {
    const from = sanitizeEnv(this.config.get<string>('EMAIL_FROM'));
    if (!from) return 'onboarding@resend.dev';
    if (from.includes('@')) {
      // Resend accepts both "name@domain.com" and "Name <name@domain.com>"
      return from;
    }
    this.logger.warn(
      `EMAIL_FROM="${from}" is not a valid sender. Using onboarding@resend.dev.`,
    );
    return 'onboarding@resend.dev';
  }

  async sendOtp(email: string, otp: string): Promise<{ success: boolean; message?: string }> {
    const provider = this.resolveProvider();
    const normalized = email.toLowerCase().trim();

    if (provider === 'resend') {
      return this.sendViaResend(normalized, otp);
    }

    this.logger.log(`[mock email] OTP for ${normalized}: ${otp}`);
    return { success: true, message: 'Verification code sent (EMAIL_PROVIDER=mock)' };
  }

  generateOtp(): string {
    return generateOtp();
  }

  private formatResendError(status: number, body: string, from: string): string {
    let detail = body;
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) detail = parsed.message;
    } catch {
      // keep raw body
    }

    if (status === 403) {
      if (/only send testing emails to your own email/i.test(detail)) {
        return (
          'Resend test mode: onboarding@resend.dev can only send to the email on your Resend account. ' +
          'Register with that email for now, or verify your domain at resend.com/domains and set EMAIL_FROM.'
        );
      }
      if (from.includes('resend.dev')) {
        return (
          'Resend rejected the test sender. Use onboarding@resend.dev and send to your Resend account email, ' +
          'or verify a domain and set EMAIL_FROM=Petspond <hello@yourdomain.com>.'
        );
      }
      return `Email sender "${from}" is not verified in Resend. Add and verify your domain at resend.com/domains.`;
    }

    if (status === 422) {
      return detail || 'Invalid email request. Check EMAIL_FROM format and recipient address.';
    }

    return detail || 'Failed to send verification email. Check RESEND_API_KEY and EMAIL_FROM.';
  }

  private async sendViaResend(email: string, otp: string): Promise<{ success: boolean; message?: string }> {
    const apiKey = sanitizeEnv(this.config.get<string>('RESEND_API_KEY'));
    if (!apiKey) {
      throw new BadRequestException(
        'RESEND_API_KEY is not configured. Add it to apps/api/.env.local or set EMAIL_PROVIDER=mock for local development.',
      );
    }

    const from = this.resolveFromAddress();
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your Petspond Vet CRM verification code',
        html: `
          <p>Your Petspond verification code is:</p>
          <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${otp}</p>
          <p>This code expires in 5 minutes. If you did not request this, you can ignore this email.</p>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Resend failed (${res.status}) from=${from} to=${email}: ${body}`);
      return {
        success: false,
        message: this.formatResendError(res.status, body, from),
      };
    }

    this.logger.log(`Verification email sent to ${email} via Resend (from ${from})`);
    return { success: true };
  }
}
