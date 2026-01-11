import { JobForm } from '@/components/jobs/JobForm';
import { ensureLogisticsCompanyAccess } from '@/lib/permissions';

export default async function Page() {
  const access = ensureLogisticsCompanyAccess();

  if (!access.authorized) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Access denied: {access.reason ?? 'Authorization not implemented.'} (status {access.status}).
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JobForm />
    </main>
  );
}
