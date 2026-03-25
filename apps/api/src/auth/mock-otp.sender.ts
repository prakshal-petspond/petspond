import { OtpSender } from './otp-sender.interface';

/**
 * Logs OTP to console. Use for development. Replace with TwilioSender / Msg91Sender in production.
 */
export class MockOtpSender implements OtpSender {
  async send(mobile: string, otp: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`\n========== OTP (MOCK) for ${mobile}: ${otp} ==========\n`);
  }
}
