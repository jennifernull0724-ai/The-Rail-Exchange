import 'server-only';

import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

import { getServerAuthContext } from '@/lib/auth';
import { ensureLogisticsCompanyAccess } from '@/lib/permissions';
import { prisma } from '@/lib/db';

type PageProps = { params: { id: string } };

export default async function EditJobPage({ params }: PageProps) {
  const job = await prisma.jobRequest.findUnique({ where: { id: params.id } });
  if (!job) notFound();

  // Only the owning logistics company can edit.
  const access = ensureLogisticsCompanyAccess(undefined, job.ownerCompanyId);
  if (!access.authorized) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Job</h1>
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            BLOCKED: {access.reason ?? 'Authorization not implemented.'} (status {access.status}).
          </div>
        </div>
      </main>
    );
  }

  let auth;
  try {
    auth = getServerAuthContext({ headers: headers() });
  } catch (err) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Job</h1>
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            BLOCKED: {err instanceof Error ? err.message : String(err)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Job</h1>
        <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
          BLOCKED: Job editing UI is not implemented yet. Job ID: {job.id}. Role: {auth.role}.
        </div>
      </div>
    </main>
  );
}
