import type { JobDetailViewModel } from '@/components/jobs/detail/types';

export function JobLocation({ job }: { job: JobDetailViewModel }) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Location &amp; Access</h2>
      <div className="text-sm text-gray-700">
        <div>
          <span className="font-medium text-gray-900">Full address:</span> {job.addressLine}
        </div>
        <div className="mt-1">
          <span className="font-medium text-gray-900">City / State:</span> {job.cityStateLine}
        </div>
        <div className="mt-1">
          <span className="font-medium text-gray-900">Facility name:</span> {job.facilityNameLabel}
        </div>
        <div className="mt-1">
          <span className="font-medium text-gray-900">Gate / check-in instructions:</span> {job.gateInstructionsLabel}
        </div>
        <div className="mt-1">
          <span className="font-medium text-gray-900">PPE requirements:</span> {job.ppeRequirementsLabel}
        </div>
        <div className="mt-1">
          <span className="font-medium text-gray-900">Clearance notes:</span> {job.clearanceNotesLabel}
        </div>
        <div className="mt-1">
          <span className="font-medium text-gray-900">Rail access notes:</span> {job.railAccessNotesLabel}
        </div>
      </div>
    </section>
  );
}
