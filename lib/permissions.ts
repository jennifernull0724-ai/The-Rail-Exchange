import 'server-only';

import { headers as nextHeaders } from 'next/headers';
import { getServerAuthContext } from '@/lib/auth';

export interface AccessDecision {
  authorized: boolean;
  status: 200 | 401 | 403;
  reason?: string;
}

type RequestLike = { headers: Headers };

function getAuthContext(req?: Request | RequestLike) {
  return getServerAuthContext(req ?? { headers: nextHeaders() });
}

export function ensureLogisticsCompanyAccess(req?: Request | RequestLike, ownerCompanyId?: string): AccessDecision {
  let context: ReturnType<typeof getAuthContext>;
  try {
    context = getAuthContext(req);
  } catch (err) {
    return {
      authorized: false,
      status: 401,
      reason: err instanceof Error ? err.message : 'Invalid auth context headers.',
    };
  }

  if (context.role !== 'logistics_company') {
    return {
      authorized: false,
      status: 403,
      reason: 'Contractor access is blocked server-side for job creation.',
    };
  }

  if (ownerCompanyId && context.companyId !== ownerCompanyId) {
    return {
      authorized: false,
      status: 403,
      reason: 'Access denied: logistics company does not own this resource.',
    };
  }

  return { authorized: true, status: 200 };
}

export function ensureContractorAccess(req?: Request | RequestLike): AccessDecision {
  let context: ReturnType<typeof getAuthContext>;
  try {
    context = getAuthContext(req);
  } catch (err) {
    return {
      authorized: false,
      status: 401,
      reason: err instanceof Error ? err.message : 'Invalid auth context headers.',
    };
  }

  if (context.role !== 'contractor') {
    return {
      authorized: false,
      status: 403,
      reason: 'Only contractors can view open requests.',
    };
  }

  if (!context.subscriptionActive) {
    return {
      authorized: false,
      status: 403,
      reason: 'Active subscription required to view open requests.',
    };
  }

  return { authorized: true, status: 200 };
}
