import 'server-only';

import { ensureLogisticsCompanyAccess } from '@/lib/permissions';

export default function CompanyPage() {
  const access = ensureLogisticsCompanyAccess();

  if (!access.authorized) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Company</h1>
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
        <h1 className="text-2xl font-semibold text-gray-900">Company</h1>

        <div className="grid gap-6">
          <section className="bg-white border rounded-lg p-6">
            <div className="text-sm font-semibold text-gray-900">Company Information</div>
            <div className="mt-2 text-sm text-gray-700">BLOCKED: Company profile data not implemented.</div>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <div className="text-sm font-semibold text-gray-900">Facilities</div>
            <div className="mt-2 text-sm text-gray-700">BLOCKED: Facilities not implemented.</div>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <div className="text-sm font-semibold text-gray-900">Actions</div>
            <div className="mt-3">
              <a href="/jobs/new" className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Create Job Request
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
