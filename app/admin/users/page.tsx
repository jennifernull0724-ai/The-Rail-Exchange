import 'server-only';

import { dbQuery } from '@/lib/db';

import { AdminTable } from '../_components/AdminTable';

export const runtime = 'nodejs';

type UserRow = {
  id: string;
  email: string;
  role: string;
  disabled: boolean;
  created_at: string;
};

export default async function AdminUsersPage() {
  const result = await dbQuery<UserRow>(
    `SELECT id::text as id, email, role, COALESCE(disabled,false) as disabled, created_at::text as created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT 100`,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Users</h1>

      <AdminTable
        columns={[
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'disabled', label: 'Status' },
          { key: 'created_at', label: 'Created' },
          { key: 'actions', label: 'Actions', align: 'right' },
        ]}
        rows={result.rows.map((u) => ({
          email: <span className="text-[#E5E7EB]">{u.email}</span>,
          role: <span className="text-[#9CA3AF]">{u.role}</span>,
          disabled: (
            <span className={u.disabled ? 'text-[#DC2626]' : 'text-[#16A34A]'}>
              {u.disabled ? 'disabled' : 'active'}
            </span>
          ),
          created_at: <span className="text-[#9CA3AF]">{u.created_at}</span>,
          actions: <span className="text-[#9CA3AF]">—</span>,
        }))}
        empty="No users found."
      />
    </div>
  );
}
