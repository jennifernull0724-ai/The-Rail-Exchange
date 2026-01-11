import type { JobDetailViewModel } from '@/components/jobs/detail/types';

export function JobPricing({ job }: { job: JobDetailViewModel }) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Pricing Context</h2>
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase">Pricing expectations</div>
        <div className="mt-1 text-sm text-gray-900">{job.pricingExpectationLabel}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase">Notes</div>
        <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{job.pricingNotesLabel}</div>
      </div>
    </section>
  );
}
