import type { JobDetailViewModel } from '@/components/jobs/detail/types';

function List({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-gray-700">—</div>;
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function JobCompliance({ job }: { job: JobDetailViewModel }) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Compliance</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm font-semibold text-gray-900">Required</div>
          <div className="mt-2">
            <List items={job.complianceRequired} />
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900">Optional</div>
          <div className="mt-2">
            <List items={job.complianceOptional} />
          </div>
        </div>
      </div>
    </section>
  );
}
