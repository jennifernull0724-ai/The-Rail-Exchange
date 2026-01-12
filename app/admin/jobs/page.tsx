import 'server-only';

import { dbQuery } from '@/lib/db';

import { AdminTable } from '../_components/AdminTable';

export const runtime = 'nodejs';

type JobRow = {
  id: string;
  company_id: string | null;
  status: string;
  created_at: string;
};

export default async function AdminJobsPage() {
  const result = await dbQuery<JobRow>(
    `SELECT id, company_id, status, created_at::text as created_at
     FROM jobs
     ORDER BY created_at DESC
     LIMIT 100`,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Jobs</h1>

      <AdminTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'company_id', label: 'Company' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Created' },
        ]}
        rows={result.rows.map((j) => ({
          id: <span className="text-[#E5E7EB]">{j.id}</span>,
          company_id: <span className="text-[#9CA3AF]">{j.company_id ?? '—'}</span>,
          status: <span className="text-[#9CA3AF]">{j.status}</span>,
          created_at: <span className="text-[#9CA3AF]">{j.created_at}</span>,
        }))}
        empty="No jobs found."
      />
    </div>
  );
}
