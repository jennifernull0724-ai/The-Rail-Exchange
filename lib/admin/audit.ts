import 'server-only';

import { dbQuery } from '@/lib/db';

export type AppendAuditEventInput = {
	actorAdminId: string;
	action: string;
	targetType?: string | null;
	targetId?: string | null;
	reason?: string | null;
	metadata?: Record<string, unknown> | null;
	ip?: string | null;
	userAgent?: string | null;
};

export async function appendAuditEvent(input: AppendAuditEventInput): Promise<void> {
	const {
		actorAdminId,
		action,
		targetType = null,
		targetId = null,
		reason = null,
		metadata = null,
		ip = null,
		userAgent = null,
	} = input;

	await dbQuery(
		`
			INSERT INTO audit_events (
				actor_admin_id,
				action,
				target_type,
				target_id,
				reason,
				metadata,
				ip,
				user_agent
			) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
		`,
		[
			actorAdminId,
			action,
			targetType,
			targetId,
			reason,
			JSON.stringify(metadata ?? {}),
			ip,
			userAgent,
		],
	);
}
