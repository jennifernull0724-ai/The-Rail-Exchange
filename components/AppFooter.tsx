import 'server-only';

import Link from 'next/link';

import { getServerAuthContext } from '@/lib/auth';

async function getRole(): Promise<string | null> {
  try {
    const auth = await getServerAuthContext();
    return auth.role;
  } catch {
    return null;
  }
}

export async function AppFooter() {
  const role = await getRole();
  const isAdmin = role === 'admin';
  const isAuthed = role !== null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-xs text-gray-700">
        <div className="min-w-[80px]">
          {isAdmin ? (
            <Link href="/admin" className="underline text-gray-900">
              Admin
            </Link>
          ) : !isAuthed ? (
            <Link href="/login" className="underline text-gray-900">
              Admin Login
            </Link>
          ) : null}
        </div>
        <div className="text-gray-600">PRODUCTION | v1.0.0</div>
      </div>
    </footer>
  );
}
