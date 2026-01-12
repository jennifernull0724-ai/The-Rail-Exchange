import 'server-only';

import { redirect } from 'next/navigation';

import { JobForm } from '@/components/jobs/JobForm';
import { getServerAuthContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function Blocked({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message}</div>
    </main>
  );
}

export default async function NewCompanyJobPage() {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch {
    redirect('/login');
  }

  if (auth.disabled) {
    return <Blocked message="Access denied: user disabled." />;
  }

  if (auth.role !== 'logistics' && auth.role !== 'admin') {
    return <Blocked message="Access denied: logistics or admin role required." />;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JobForm />
    </main>
  );
}
