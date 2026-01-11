import 'server-only';

import { dbQuery, withDbTransaction } from '@/lib/db';

export async function getAdminCreatedFlag(): Promise<boolean> {
	const result = await dbQuery<{ value: boolean }>(
		`SELECT value FROM system_state WHERE key = 'admin_created' LIMIT 1`,
	);
	return result.rows[0]?.value === true;
}

export async function lockAndAssertAdminNotCreated(): Promise<void> {
	await withDbTransaction(async (client) => {
		const row = await client.query<{ value: boolean }>(
			`SELECT value FROM system_state WHERE key = 'admin_created' FOR UPDATE`,
		);
		const created = row.rows[0]?.value === true;
		if (created) {
			throw new Error('System already initialized.');
		}
	});
}
