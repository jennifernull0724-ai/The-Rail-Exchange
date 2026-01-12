import 'server-only';

export type RequiredEnvKey =
  | 'NODE_ENV'
  | 'APP_BASE_URL'
  | 'AUTH_SECRET'
  | 'SESSION_SECRET'
  | 'DATABASE_URL'
  | 'FILE_STORAGE_PROVIDER'
  | 'FILE_STORAGE_BUCKET'
  | 'FILE_STORAGE_REGION'
  | 'FILE_STORAGE_ACCESS_KEY'
  | 'FILE_STORAGE_SECRET_KEY'
  | 'MAPS_API_KEY'
  | 'EMAIL_PROVIDER'
  | 'EMAIL_FROM_ADDRESS'
  | 'EMAIL_API_KEY'
  | 'BILLING_PROVIDER'
  | 'BILLING_API_KEY'
  | 'BILLING_WEBHOOK_SECRET';

function applyEnvAliases(): void {
  // Keep the app config stable while allowing provider-specific env naming.
  if ((process.env.EMAIL_API_KEY === undefined || process.env.EMAIL_API_KEY.trim() === '') && process.env.EMAIL_PROVIDER === 'sendgrid') {
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey !== undefined && sendgridKey.trim() !== '') {
      process.env.EMAIL_API_KEY = sendgridKey;
    }
  }
}

function readEnv(key: string): string | null {
  const value = process.env[key];
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getEnv(key: RequiredEnvKey): string | null {
  if (typeof window !== 'undefined') {
    return null;
  }
  applyEnvAliases();
  return readEnv(key);
}

export function requireEnv(key: RequiredEnvKey): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`BLOCKED: Missing required env var ${key}`);
  }
  return value;
}

export function hasEnv(key: RequiredEnvKey): boolean {
  return Boolean(getEnv(key));
}

export function requireAllEnv(keys: readonly RequiredEnvKey[]): Record<RequiredEnvKey, string> {
  const out: Partial<Record<RequiredEnvKey, string>> = {};
  for (const key of keys) {
    out[key] = requireEnv(key);
  }
  return out as Record<RequiredEnvKey, string>;
}
