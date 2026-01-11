import 'server-only';

import { getServerAuthContext } from '@/lib/auth';

export interface AccessDecision {
  authorized: boolean;
  status: 200 | 401 | 403;
  reason?: string;
}

export async function ensureLogisticsCompanyAccess(_req?: Request, _ownerCompanyId?: string): Promise<AccessDecision> {
	let context: Awaited<ReturnType<typeof getServerAuthContext>>;
  try {
		context = await getServerAuthContext();
  } catch (err) {
    return {
      authorized: false,
      status: 401,
      reason: err instanceof Error ? err.message : 'Invalid auth context headers.',
    };
  }

	if (context.isOwner) {
		return { authorized: true, status: 200 };
	}

	if (context.role !== 'logistics') {
    return {
      authorized: false,
      status: 403,
      reason: 'Contractor access is blocked server-side for job creation.',
    };
  }

  return { authorized: true, status: 200 };
}

export async function ensureContractorAccess(_req?: Request): Promise<AccessDecision> {
	let context: Awaited<ReturnType<typeof getServerAuthContext>>;
  try {
		context = await getServerAuthContext();
  } catch (err) {
    return {
      authorized: false,
      status: 401,
      reason: err instanceof Error ? err.message : 'Invalid auth context headers.',
    };
  }

	if (context.isOwner) {
		return { authorized: true, status: 200 };
	}

  if (context.role !== 'contractor') {
    return {
      authorized: false,
      status: 403,
      reason: 'Only contractors can view open requests.',
    };
  }

  return { authorized: true, status: 200 };
}
