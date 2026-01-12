import 'server-only';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getServerAuthContext } from '@/lib/auth';
import { StartCheckoutButton } from '@/components/billing/StartCheckoutButton';
import { AutoStartCheckout } from '@/components/billing/AutoStartCheckout';
import { isActiveSubscription } from '@/lib/stripe/state';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContractorDashboardPage() {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch {
    redirect('/login');
  }

  if (!auth.isOwner && auth.disabled) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">BLOCKED: User disabled.</div>
        </div>
      </main>
    );
  }

  if (!auth.isOwner && auth.role !== 'contractor') {
    redirect('/jobs');
  }

  const hasActiveSubscription = await isActiveSubscription(auth.userId);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Contractor</h1>

        <section className="bg-white border rounded-lg p-6">
          <div className="text-sm font-semibold text-gray-900">Billing</div>
          <div className="mt-2 text-sm text-gray-700">Activate your contractor account to access the marketplace.</div>
          <div className="mt-4 flex flex-wrap gap-3">
			<StartCheckoutButton
				role="contractor"
        successPath="/jobs?checkout=success"
        cancelPath="/contractor?checkout=cancel"
				label="Start Annual ($349)"
				className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
			/>
          </div>
          {!hasActiveSubscription ? (
            <div className="mt-3 text-xs text-gray-600">
              Redirecting to checkout…
              <AutoStartCheckout
                role="contractor"
              successPath="/jobs?checkout=success"
              cancelPath="/contractor?checkout=cancel"
              />
            </div>
          ) : (
            <div className="mt-3 text-xs text-gray-600">Subscription active.</div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="bg-white border rounded-lg p-6">
            <div className="text-sm font-semibold text-gray-900">Saved Jobs</div>
            <div className="mt-2 text-sm text-gray-700">Browse jobs and save what you want to bid.</div>
            <div className="mt-4">
              <Link href="/jobs" className="text-blue-700 hover:underline">Go to listings</Link>
            </div>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <div className="text-sm font-semibold text-gray-900">Messages</div>
            <div className="mt-2 text-sm text-gray-700">Messaging is not available in this build.</div>
          </section>
        </div>

        <section className="bg-white border rounded-lg p-6">
          <div className="text-sm font-semibold text-gray-900">Profile</div>
          <div className="mt-2 text-sm text-gray-700">Manage your contractor profile.</div>
          <div className="mt-4">
            <Link href="/contractor/profile" className="text-blue-700 hover:underline">View profile</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
