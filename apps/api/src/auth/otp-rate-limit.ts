/**
 * In-memory rate limit for send-otp per mobile. Prevents abuse when using paid SMS (e.g. Twilio).
 * Replace with Redis in production for multi-instance.
 */
const lastSentAt = new Map<string, number>();

const COOLDOWN_MS = 60 * 1000; // 1 minute

export function canSendOtp(mobile: string): boolean {
  const normalized = mobile.replace(/\D/g, '').slice(-10);
  const at = lastSentAt.get(normalized);
  if (!at) return true;
  return Date.now() - at >= COOLDOWN_MS;
}

export function recordOtpSent(mobile: string): void {
  const normalized = mobile.replace(/\D/g, '').slice(-10);
  lastSentAt.set(normalized, Date.now());
}

export function getCooldownSeconds(): number {
  return Math.ceil(COOLDOWN_MS / 1000);
}
