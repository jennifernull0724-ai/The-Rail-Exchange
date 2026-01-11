import 'server-only';

import { ensureContractorAccess } from '@/lib/permissions';

export default function ProfilePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const access = ensureContractorAccess();

  const saveJobId = typeof searchParams?.saveJobId === 'string' ? searchParams.saveJobId : null;

  if (!access.authorized) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            BLOCKED: {access.reason ?? 'Authorization not implemented.'} (status {access.status}).
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>

        {saveJobId ? (
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            BLOCKED: Save Job requires a persistence layer for contractor saved jobs. Job ID: {saveJobId}
          </div>
        ) : null}

        <div className="grid gap-6">
          <section className="bg-white border rounded-lg p-6">
            <div className="text-sm font-semibold text-gray-900">Company Information</div>
            <div className="mt-2 text-sm text-gray-700">BLOCKED: Profile data not implemented.</div>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <div className="text-sm font-semibold text-gray-900">Certifications</div>
            <div className="mt-2 text-sm text-gray-700">BLOCKED: Certification uploads not implemented.</div>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <div className="text-sm font-semibold text-gray-900">Subscription</div>
            <div className="mt-2 flex gap-3">
              <a href="/settings" className="rounded-md border px-4 py-2 text-sm">
                Manage Subscription
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
