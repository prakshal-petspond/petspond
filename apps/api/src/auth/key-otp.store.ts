/**
 * Key-based OTP store (email verification, onboarding phone, etc.).
 */
const store = new Map<string, { otp: string; expiresAt: number }>();

const TTL_MS = 5 * 60 * 1000;

export function setOtpForKey(key: string, otp: string, ttlMs = TTL_MS): void {
  store.set(key, { otp, expiresAt: Date.now() + ttlMs });
}

export function getAndDeleteOtpForKey(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  store.delete(key);
  return entry.otp;
}

export function hasOtpForKey(key: string): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return false;
  }
  return true;
}
