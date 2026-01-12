import 'server-only';

import { dbQuery } from '@/lib/db';

import { AdminTable } from '../_components/AdminTable';

export const runtime = 'nodejs';

type CompanyRow = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

export default async function AdminCompaniesPage() {
  const result = await dbQuery<CompanyRow>(
    `SELECT id, name, status, created_at::text as created_at
     FROM companies
     ORDER BY created_at DESC
     LIMIT 100`,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Companies</h1>

      <AdminTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Created' },
          { key: 'actions', label: 'Actions', align: 'right' },
        ]}
        rows={result.rows.map((c) => ({
          name: <span className="text-[#E5E7EB]">{c.name}</span>,
          status: <span className="text-[#9CA3AF]">{c.status}</span>,
          created_at: <span className="text-[#9CA3AF]">{c.created_at}</span>,
          actions: <span className="text-[#9CA3AF]">—</span>,
        }))}
        empty="No companies found."
      />
    </div>
  );
}
