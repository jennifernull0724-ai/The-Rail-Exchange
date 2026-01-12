import 'server-only';

import { redirect } from 'next/navigation';

import { getServerAuthContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  try {
    const auth = await getServerAuthContext();
    if (auth.isOwner) redirect('/jobs');
    if (auth.role === 'admin') redirect('/jobs');
    if (auth.role === 'contractor') redirect('/jobs');
    if (auth.role === 'logistics') redirect('/company');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Not authenticated')) {
      redirect('/login');
    }
    // If they *are* authenticated but not provisioned, keep them out of the shell.
    redirect('/login');
  }
}
