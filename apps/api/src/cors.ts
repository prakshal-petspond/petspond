/**
 * Parses CORS_ORIGINS (comma-separated URLs). In production, set this to your
 * Netlify Vet CRM URLs. When unset in development, all origins are allowed.
 */
export function resolveCorsOrigin(): boolean | string | string[] {
  const raw = process.env.CORS_ORIGINS?.trim();

  if (!raw) {
    return process.env.NODE_ENV === 'production' ? [] : true;
  }

  if (raw === '*') return true;

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
