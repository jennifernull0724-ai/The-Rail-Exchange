import 'server-only';

import '@/lib/env';

import { requireAdmin } from '@/lib/admin/guard';
import { requireAdminAnalyticsSources } from '@/lib/admin/sources';
import { dbQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function Blocked({ title, message }: { title: string; message: string }) {
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
				<h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
				<div className="bg-white border rounded-lg p-6 text-sm text-gray-800">BLOCKED: {message}</div>
			</div>
		</main>
	);
}

type CountRow = { count: string };

async function getCount(sql: string, params: readonly unknown[] = []): Promise<number> {
	const result = await dbQuery<CountRow>(sql, params);
	const raw = result.rows[0]?.count ?? '0';
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

export default async function AdminDashboardPage() {
	const admin = await requireAdmin();
	if (!('ok' in admin)) {
		return <Blocked title="Admin" message={admin.message} />;
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return <Blocked title="Admin" message={sources.message} />;
	}

	// All data below must be DB-backed (no mock/placeholder values).
	const [
		usersTotal,
		companiesTotal,
		jobsTotal,
		messagesTotal,
		auditTotal,
		emailEventsTotal,
	] = await Promise.all([
		getCount('SELECT COUNT(*)::text AS count FROM users'),
		getCount('SELECT COUNT(*)::text AS count FROM companies'),
		getCount('SELECT COUNT(*)::text AS count FROM jobs'),
		getCount('SELECT COUNT(*)::text AS count FROM messages'),
		getCount('SELECT COUNT(*)::text AS count FROM audit_events'),
		getCount('SELECT COUNT(*)::text AS count FROM email_events'),
	]);

	const jobStatusRows = await dbQuery<{ status: string; count: string }>(
		`SELECT status, COUNT(*)::text AS count FROM jobs GROUP BY status ORDER BY count DESC`,
	);

	const auditRows = await dbQuery<{
		created_at: string;
		action: string;
		actor_admin_id: string;
		target_type: string | null;
		target_id: string | null;
		reason: string | null;
	}>(
		`SELECT created_at::text, action, actor_admin_id, target_type, target_id, reason
		 FROM audit_events
		 ORDER BY created_at DESC
		 LIMIT 25`,
	);

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
						<p className="mt-1 text-sm text-gray-600">System observability, compliance, and audit.</p>
					</div>
					<div className="text-xs text-gray-600">Admin: {admin.adminId}</div>
				</div>

				<section className="bg-white border rounded-lg p-5">
					<div className="text-sm font-semibold text-gray-900">Core Totals</div>
					<div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
						<div className="border rounded-md p-3">
							<div className="text-[11px] text-gray-600">Users</div>
							<div className="mt-1 text-lg font-semibold text-gray-900">{usersTotal}</div>
						</div>
						<div className="border rounded-md p-3">
							<div className="text-[11px] text-gray-600">Companies</div>
							<div className="mt-1 text-lg font-semibold text-gray-900">{companiesTotal}</div>
						</div>
						<div className="border rounded-md p-3">
							<div className="text-[11px] text-gray-600">Jobs</div>
							<div className="mt-1 text-lg font-semibold text-gray-900">{jobsTotal}</div>
						</div>
						<div className="border rounded-md p-3">
							<div className="text-[11px] text-gray-600">Messages</div>
							<div className="mt-1 text-lg font-semibold text-gray-900">{messagesTotal}</div>
						</div>
						<div className="border rounded-md p-3">
							<div className="text-[11px] text-gray-600">Email Events</div>
							<div className="mt-1 text-lg font-semibold text-gray-900">{emailEventsTotal}</div>
						</div>
						<div className="border rounded-md p-3">
							<div className="text-[11px] text-gray-600">Audit Events</div>
							<div className="mt-1 text-lg font-semibold text-gray-900">{auditTotal}</div>
						</div>
					</div>
				</section>

				<section className="bg-white border rounded-lg p-5">
					<div className="flex items-center justify-between">
						<div className="text-sm font-semibold text-gray-900">Job Flow</div>
						<div className="text-xs text-gray-600">By status (live)</div>
					</div>
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left text-xs text-gray-600">
									<th className="py-2 pr-4">Status</th>
									<th className="py-2">Count</th>
								</tr>
							</thead>
							<tbody>
								{jobStatusRows.rows.map((r) => (
									<tr key={r.status} className="border-t">
										<td className="py-2 pr-4 font-medium text-gray-900">{r.status}</td>
										<td className="py-2 text-gray-800">{Number.parseInt(r.count, 10) || 0}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<section className="bg-white border rounded-lg p-5">
					<div className="flex items-center justify-between">
						<div className="text-sm font-semibold text-gray-900">Audit Log</div>
						<div className="text-xs text-gray-600">Most recent 25</div>
					</div>
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left text-xs text-gray-600">
									<th className="py-2 pr-4">Time</th>
									<th className="py-2 pr-4">Action</th>
									<th className="py-2 pr-4">Actor</th>
									<th className="py-2 pr-4">Target</th>
									<th className="py-2">Reason</th>
								</tr>
							</thead>
							<tbody>
								{auditRows.rows.map((r, idx) => (
									<tr key={`${r.created_at}-${idx}`} className="border-t">
										<td className="py-2 pr-4 text-gray-800 whitespace-nowrap">{r.created_at}</td>
										<td className="py-2 pr-4 font-medium text-gray-900">{r.action}</td>
										<td className="py-2 pr-4 text-gray-800">{r.actor_admin_id}</td>
										<td className="py-2 pr-4 text-gray-800">
											{r.target_type ? `${r.target_type}:${r.target_id ?? ''}` : '—'}
										</td>
										<td className="py-2 text-gray-800">{r.reason ?? '—'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</main>
	);
}
