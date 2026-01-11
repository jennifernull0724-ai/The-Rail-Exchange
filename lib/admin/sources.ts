import 'server-only';

import { prisma } from '@/lib/db';

const REQUIRED_TABLES = [
  'audit_events',
  'api_metrics',
  'email_events',
  'jobs',
  'messages',
  'documents',
  'certifications',
  'users',
  'companies',
] as const;

export type AdminSourcesOk = { ok: true };
export type AdminSourcesBlocked = {
  ok: false;
  message: 'Admin analytics unavailable — required system source not configured.';
};

async function tableExists(table: string): Promise<boolean> {
  const rows = (await prisma.$queryRaw`
    SELECT to_regclass(${`public.${table}`}) IS NOT NULL as exists
  `) as Array<{ exists: boolean | null }>;

  return rows[0]?.exists === true;
}

/**
 * Per spec: if ANY required source table is missing, the Admin UI must render
 * “Admin analytics unavailable — required system source not configured.”
 */
export async function requireAdminAnalyticsSources(): Promise<AdminSourcesOk | AdminSourcesBlocked> {
  try {
    const checks = await Promise.all(REQUIRED_TABLES.map((t) => tableExists(t)));
    const allPresent = checks.every(Boolean);
    if (!allPresent) {
      return { ok: false, message: 'Admin analytics unavailable — required system source not configured.' };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: 'Admin analytics unavailable — required system source not configured.' };
  }
}
