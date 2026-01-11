import 'server-only';

const REQUIRED_ENV_KEYS = [
  'NODE_ENV',
  'APP_BASE_URL',
  'AUTH_SECRET',
  'SESSION_SECRET',
  'DATABASE_URL',
  'FILE_STORAGE_PROVIDER',
  'FILE_STORAGE_BUCKET',
  'FILE_STORAGE_REGION',
  'FILE_STORAGE_ACCESS_KEY',
  'FILE_STORAGE_SECRET_KEY',
  'MAPS_API_KEY',
  'EMAIL_PROVIDER',
  'EMAIL_FROM_ADDRESS',
  'EMAIL_API_KEY',
  'BILLING_PROVIDER',
  'BILLING_API_KEY',
  'BILLING_WEBHOOK_SECRET',
] as const;

function applyEnvAliases(): void {
  // Keep the app config stable while allowing provider-specific env naming.
  if ((process.env.EMAIL_API_KEY === undefined || process.env.EMAIL_API_KEY.trim() === '') && process.env.EMAIL_PROVIDER === 'sendgrid') {
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey !== undefined && sendgridKey.trim() !== '') {
      process.env.EMAIL_API_KEY = sendgridKey;
    }
  }
}

function validateRequiredEnv(): void {
  if (typeof window !== 'undefined') {
    throw new Error('lib/env.ts must never execute in the browser.');
  }

  applyEnvAliases();

  const missing = REQUIRED_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return value === undefined || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateRequiredEnv();

export type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number];
