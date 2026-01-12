import 'server-only';

import { getServerAuthContext } from '@/lib/auth';

export type AdminBlocked = {
  blocked: true;
  message: string;
};

export type AdminOk = {
  ok: true;
  adminId: string;
  isOwner: boolean;
};

export async function requireAdmin(_req?: Request): Promise<AdminOk | AdminBlocked> {
  try {
    const auth = await getServerAuthContext();
    if (auth.isOwner) {
      return { ok: true, adminId: auth.userId, isOwner: true };
    }
    if (auth.role !== 'admin' || auth.disabled) {
      return { blocked: true, message: 'Admin access required.' };
    }
    return { ok: true, adminId: auth.userId, isOwner: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin access required.';
    if (typeof message === 'string' && message.toLowerCase().includes('not authenticated')) {
      return { blocked: true, message: 'Not authenticated.' };
    }
    if (typeof message === 'string' && message.toLowerCase().includes('not provisioned')) {
      return { blocked: true, message: 'User not provisioned.' };
    }
    return { blocked: true, message: 'Admin access required.' };
  }
}
