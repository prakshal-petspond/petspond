/**
 * Implement this interface with Twilio, MSG91, Firebase, etc.
 */
export interface OtpSender {
  send(mobile: string, otp: string, options?: { countryCode?: string }): Promise<void>;
}
