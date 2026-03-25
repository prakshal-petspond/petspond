/**
 * In-memory OTP store. Replace with Redis in production for multi-instance and TTL.
 */
const store = new Map<string, { otp: string; expiresAt: number }>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function setOtp(mobile: string, otp: string): void {
  const normalized = mobile.replace(/\D/g, '').slice(-10);
  store.set(normalized, {
    otp,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function getAndDeleteOtp(mobile: string): string | null {
  const normalized = mobile.replace(/\D/g, '').slice(-10);
  const entry = store.get(normalized);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(normalized);
    return null;
  }
  store.delete(normalized);
  return entry.otp;
}

export function hasOtp(mobile: string): boolean {
  const normalized = mobile.replace(/\D/g, '').slice(-10);
  const entry = store.get(normalized);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(normalized);
    return false;
  }
  return true;
}
