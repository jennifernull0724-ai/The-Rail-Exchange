import 'server-only';

import { dbQuery } from '@/lib/db';

export async function recordApiMetric(input: {
	route: string;
	method: string;
	statusCode: number;
	durationMs: number;
}): Promise<void> {
	await dbQuery(
		`INSERT INTO api_metrics (route, method, status_code, duration_ms) VALUES ($1, $2, $3, $4)` ,
		[input.route, input.method, input.statusCode, input.durationMs],
	);
}
