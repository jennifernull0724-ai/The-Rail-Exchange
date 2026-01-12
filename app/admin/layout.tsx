import type { ReactNode } from 'react';

import { dbQuery } from '@/lib/db';
import { requireRole } from '@/lib/auth/requireRole';
import { signOut } from '@/lib/auth/actions';

import { AdminSidebar } from './_components/AdminSidebar';

function AdminAccessOnly() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E5E7EB] flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-[#1F2A44] bg-[#111A2E] rounded-lg p-6">
        <div className="text-xl font-semibold">403 — Admin Access Only</div>
        <div className="mt-2 text-sm text-[#9CA3AF]">Access to this console is restricted.</div>
      </div>
    </div>
  );
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let adminEmail: string | null = null;
  try {
    const auth = await requireRole('admin');
    const res = await dbQuery<{ email: string | null }>('SELECT email FROM users WHERE id::text = $1 LIMIT 1', [auth.userId]);
    adminEmail = res.rows[0]?.email ?? null;
  } catch {
    return <AdminAccessOnly />;
  }

  const appEnvRaw = (process.env.APP_ENV ?? '').toString().trim().toUpperCase();
  const envLabel = appEnvRaw === 'LIVE' || appEnvRaw === 'STAGING'
    ? appEnvRaw
    : process.env.NODE_ENV === 'production'
      ? 'LIVE'
      : 'STAGING';
  const envTone = envLabel === 'LIVE' ? 'bg-[#16A34A]' : 'bg-[#D97706]';

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E5E7EB]">
      <header className="h-12 border-b border-[#1F2A44] bg-[#0B1220]">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between px-4">
          <div className="text-sm font-semibold">Admin Console</div>
          <div className="flex items-center gap-3">
            <span className={`rounded-md px-2 py-1 text-xs font-medium text-[#0B1220] ${envTone}`}>{envLabel}</span>
            <span className="text-sm text-[#9CA3AF]">{adminEmail ?? 'admin'}</span>
				<form action={signOut}>
					<button type="submit" className="rounded-md border border-[#1F2A44] bg-transparent px-3 py-1.5 text-sm text-[#E5E7EB]">
						Logout
					</button>
				</form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
