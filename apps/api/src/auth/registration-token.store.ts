/**
 * Short-lived tokens issued after email OTP verification, before password is set.
 */
const store = new Map<string, { email: string; expiresAt: number }>();

const TTL_MS = 30 * 60 * 1000;

export function createRegistrationToken(email: string): string {
  const token = `reg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  store.set(token, { email: email.toLowerCase().trim(), expiresAt: Date.now() + TTL_MS });
  return token;
}

export function consumeRegistrationToken(token: string): string | null {
  const entry = store.get(token);
  if (!entry) return null;
  store.delete(token);
  if (Date.now() > entry.expiresAt) return null;
  return entry.email;
}
