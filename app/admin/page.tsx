import 'server-only';

import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />;
}

type CountRow = { count: string };

async function safeCount(sql: string, params: readonly unknown[] = []): Promise<number | null> {
  try {
    const result = await dbQuery<CountRow>(sql, params);
    const raw = result.rows[0]?.count ?? '0';
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return null;
  }
}

type AuditRow = {
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

function formatActivity(a: AuditRow): string {
  const action = (a.action || '').toLowerCase();
  if (action.includes('user') && action.includes('create')) return 'User created';
  if (action.includes('company') && action.includes('create')) return 'Company created';
  if (action.includes('job') && (action.includes('post') || action.includes('create'))) return 'Job posted';
  if (action.includes('payment') && (action.includes('capture') || action.includes('succeed'))) return 'Payment captured';
  if (action.includes('subscription') && action.includes('cancel')) return 'Subscription canceled';
  return a.action;
}

export default async function AdminDashboard() {
  const [totalUsers, activeCompanies, openJobs] = await Promise.all([
    safeCount('SELECT COUNT(*)::text AS count FROM users'),
    safeCount("SELECT COUNT(*)::text AS count FROM companies WHERE COALESCE(status,'active') = 'active'"),
    safeCount("SELECT COUNT(*)::text AS count FROM jobs WHERE status = 'open'"),
  ]);

  const revenueMtd = await safeCount(
    "SELECT COALESCE(SUM(amount),0)::text AS count FROM payments WHERE created_at >= date_trunc('month', now())",
  );

  const activity = await (async () => {
    try {
      const rows = await dbQuery<AuditRow>(
        `SELECT action, target_type, target_id, created_at::text as created_at
         FROM audit_events
         ORDER BY created_at DESC
         LIMIT 20`,
      );
      return rows.rows;
    } catch {
      return [] as AuditRow[];
    }
  })();

  const emailOk = Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.POSTMARK_SERVER_TOKEN);
  const paymentsOk = Boolean(process.env.STRIPE_SECRET_KEY);
  const storageOk = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && (process.env.S3_BUCKET || process.env.AWS_S3_BUCKET));
  const webhooksOk = Boolean(process.env.STRIPE_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-[#111A2E] border border-[#1F2A44] rounded-lg p-4">
          <div className="text-sm text-[#9CA3AF]">Total Users</div>
          <div className="text-2xl font-semibold mt-1">{totalUsers === null ? 'N/A' : totalUsers}</div>
        </div>
        <div className="bg-[#111A2E] border border-[#1F2A44] rounded-lg p-4">
          <div className="text-sm text-[#9CA3AF]">Active Companies</div>
          <div className="text-2xl font-semibold mt-1">{activeCompanies === null ? 'N/A' : activeCompanies}</div>
        </div>
        <div className="bg-[#111A2E] border border-[#1F2A44] rounded-lg p-4">
          <div className="text-sm text-[#9CA3AF]">Open Jobs</div>
          <div className="text-2xl font-semibold mt-1">{openJobs === null ? 'N/A' : openJobs}</div>
        </div>
        <div className="bg-[#111A2E] border border-[#1F2A44] rounded-lg p-4">
          <div className="text-sm text-[#9CA3AF]">Revenue (MTD)</div>
          <div className="text-2xl font-semibold mt-1">{revenueMtd === null ? 'N/A' : revenueMtd}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 bg-[#111A2E] border border-[#1F2A44] rounded-lg p-4">
          <div className="text-sm font-medium uppercase tracking-wide text-[#9CA3AF] mb-3">Activity Feed</div>
          <ul className="text-sm space-y-2">
            {activity.length === 0 ? (
              <li className="text-[#9CA3AF]">No activity.</li>
            ) : (
              activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span className="text-[#E5E7EB]">{formatActivity(a)}</span>
                  <span className="text-xs text-[#6B7280]">{a.created_at}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="bg-[#111A2E] border border-[#1F2A44] rounded-lg p-4">
          <div className="text-sm font-medium uppercase tracking-wide text-[#9CA3AF] mb-3">System Status</div>
          <ul className="text-sm space-y-2">
            <li className="flex items-center justify-between"><span>Email</span><StatusDot ok={emailOk} /></li>
            <li className="flex items-center justify-between"><span>Payments</span><StatusDot ok={paymentsOk} /></li>
            <li className="flex items-center justify-between"><span>Storage</span><StatusDot ok={storageOk} /></li>
            <li className="flex items-center justify-between"><span>Webhooks</span><StatusDot ok={webhooksOk} /></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
