import 'server-only';

import { dbQuery } from '@/lib/db';
import { BootstrapAdminForm } from './BootstrapAdminForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BootstrapAdminPage({
	searchParams,
}: {
	searchParams?: { created?: string; error?: string };
}) {
	const row = await dbQuery<{ value: boolean }>(
		`SELECT value FROM system_state WHERE key = 'admin_created' LIMIT 1`,
	);
	const adminCreated = row.rows[0]?.value === true;

	const created = searchParams?.created === '1';
	const error = typeof searchParams?.error === 'string' ? searchParams.error : null;

	if (adminCreated) {
		return (
			<main className="min-h-screen bg-gray-50">
				<div className="mx-auto max-w-md px-4 py-10 space-y-4">
					<h1 className="text-2xl font-semibold text-gray-900">Bootstrap System Owner</h1>
					<div className="rounded-lg border bg-white p-5 text-sm text-gray-900">
						BLOCKED: System already initialized.
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-md px-4 py-10 space-y-6">
				<h1 className="text-2xl font-semibold text-gray-900">Bootstrap System Owner</h1>
				<p className="text-sm text-gray-700">Create the first admin user (system owner).</p>
				{created ? (
					<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
						System owner created. You can now sign in at <a className="underline" href="/login">/login</a>.
					</div>
				) : null}
				{error ? (
					<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
						BLOCKED: {error}
					</div>
				) : null}
				<div className="rounded-lg border bg-white p-5">
					<BootstrapAdminForm />
				</div>
			</div>
		</main>
	);
}
