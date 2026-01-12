import 'server-only';

import { dbQuery } from '@/lib/db';

export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing';

export type BillingSubscriptionRow = {
	user_id: string;
	role: string;
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	status: string;
	last_payment_status: string | null;
	current_period_end: string | null;
};

export async function getBillingSubscriptionForUser(userId: string): Promise<BillingSubscriptionRow | null> {
	const res = await dbQuery<BillingSubscriptionRow>(
		`SELECT user_id, role, stripe_customer_id, stripe_subscription_id, status, last_payment_status, current_period_end
		 FROM billing_subscriptions
		 WHERE user_id = $1
		 LIMIT 1`,
		[userId],
	);
	return res.rows[0] ?? null;
}

export async function isActiveSubscription(userId: string): Promise<boolean> {
	try {
		const row = await getBillingSubscriptionForUser(userId);
		if (!row) return false;
		return row.status === 'active' || row.status === 'trialing';
	} catch {
		// If state lookup fails, default to not active so billing can be enforced.
		return false;
	}
}
