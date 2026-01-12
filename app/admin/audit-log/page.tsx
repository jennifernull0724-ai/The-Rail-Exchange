import 'server-only';

import { dbQuery } from '@/lib/db';

import { AdminTable } from '../_components/AdminTable';

export const runtime = 'nodejs';

type AuditRow = {
  id: string;
  actor_admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

export default async function AdminAuditLogPage() {
  const result = await dbQuery<AuditRow>(
    `SELECT id::text as id, actor_admin_id, action, target_type, target_id, created_at::text as created_at
     FROM audit_events
     ORDER BY created_at DESC
     LIMIT 200`,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Audit Log</h1>

      <AdminTable
        columns={[
          { key: 'created', label: 'Created' },
          { key: 'action', label: 'Action' },
          { key: 'actor', label: 'Actor' },
          { key: 'entity', label: 'Entity' },
        ]}
        rows={result.rows.map((e) => ({
          created: <span className="text-[#9CA3AF]">{e.created_at}</span>,
          action: <span className="text-[#E5E7EB]">{e.action}</span>,
          actor: <span className="text-[#9CA3AF]">{e.actor_admin_id ?? '—'}</span>,
          entity: <span className="text-[#9CA3AF]">{(e.target_type ?? '—') + (e.target_id ? `:${e.target_id}` : '')}</span>,
        }))}
        empty="No audit events found."
      />
    </div>
  );
}
