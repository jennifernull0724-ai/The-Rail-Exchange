import 'server-only';

import { dbQuery } from '@/lib/db';

import { AdminTable } from '../_components/AdminTable';

export const runtime = 'nodejs';

type DocumentRow = {
  id: string;
  owner_user_id: string | null;
  owner_company_id: string | null;
  kind: string;
  status: string;
  created_at: string;
  expires_at: string | null;
};

export default async function AdminDocumentsPage() {
  const result = await dbQuery<DocumentRow>(
    `SELECT id, owner_user_id, owner_company_id, kind, status, created_at::text as created_at, expires_at::text as expires_at
     FROM documents
     ORDER BY created_at DESC
     LIMIT 100`,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Documents</h1>

      <AdminTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'kind', label: 'Kind' },
          { key: 'status', label: 'Status' },
          { key: 'owner', label: 'Owner' },
          { key: 'created', label: 'Created' },
          { key: 'expires', label: 'Expires' },
        ]}
        rows={result.rows.map((d) => ({
          id: <span className="text-[#E5E7EB]">{d.id}</span>,
          kind: <span className="text-[#9CA3AF]">{d.kind}</span>,
          status: <span className="text-[#9CA3AF]">{d.status}</span>,
          owner: <span className="text-[#9CA3AF]">{d.owner_company_id ?? d.owner_user_id ?? '—'}</span>,
          created: <span className="text-[#9CA3AF]">{d.created_at}</span>,
          expires: <span className="text-[#9CA3AF]">{d.expires_at ?? '—'}</span>,
        }))}
        empty="No documents found."
      />
    </div>
  );
}
