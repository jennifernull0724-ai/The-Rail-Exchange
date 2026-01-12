import 'server-only';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getServerAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StartCheckoutButton } from '@/components/billing/StartCheckoutButton';
import { ManageBillingButton } from '@/components/billing/ManageBillingButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompanyPage() {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Company</h1>
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            BLOCKED: {err instanceof Error ? err.message : String(err)}
          </div>
        </div>
      </main>
    );
  }

  if (auth.disabled) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Company</h1>
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">BLOCKED: User disabled.</div>
        </div>
      </main>
    );
  }

  if (auth.isOwner || auth.role === 'admin') {
    redirect('/admin');
  }

  if (auth.role !== 'logistics') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Company</h1>
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">BLOCKED: Logistics access required.</div>
        </div>
      </main>
    );
  }

  const jobs = await prisma.jobRequest.findMany({
    where: { ownerCompanyId: auth.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Company</h1>
          <Link href="/company/jobs/new" className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Create New Job
          </Link>
        </div>

        <section className="bg-white border rounded-lg p-6">
          <div className="text-sm font-semibold text-gray-900">Billing</div>
          <div className="mt-2 text-sm text-gray-700">Choose a plan to activate your logistics account.</div>
          <div className="mt-4 flex flex-wrap gap-3">
          <StartCheckoutButton
            role="logistics"
            plan="monthly"
            successPath="/company?checkout=success"
            cancelPath="/company?checkout=cancel"
            label="Start Monthly ($499)"
            className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          />
          <StartCheckoutButton
            role="logistics"
            plan="annual"
            successPath="/company?checkout=success"
            cancelPath="/company?checkout=cancel"
            label="Start Annual ($4,800)"
            className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          />
          <ManageBillingButton
            label="Manage Billing"
            returnPath="/company"
            className="inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 disabled:opacity-50"
          />
          </div>
          <div className="mt-3 text-xs text-gray-600">If billing is not configured, the API returns error: billing_unavailable.</div>
        </section>

        <section className="bg-white border rounded-lg p-6">
          <div className="text-sm font-semibold text-gray-900">Your Listings</div>

          {jobs.length === 0 ? (
            <div className="mt-2 text-sm text-gray-700">No jobs posted yet.</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Posted</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  {jobs.map((j) => (
                    <tr key={j.id} className="border-t">
                      <td className="py-2 pr-4">
                        <Link className="text-blue-700 hover:underline" href={`/jobs/${encodeURIComponent(j.id)}`}>
                          {j.title}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{j.status}</td>
                      <td className="py-2 pr-4">{new Date(j.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
