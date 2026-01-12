import 'server-only';

// NOTE: This module previously imported the Stripe SDK directly.
// That violates this repo's strict "Stripe server-only" boundary.
// Do not add Stripe imports here. Use `lib/stripe/client.ts` inside `app/api/billing/*` instead.

export { getSuccessPathForPlan, getCancelPathForPlan } from '@/lib/billing/plans';
export type { CheckoutPlan } from '@/lib/billing/plans';

function blocked(): never {
	throw new Error('BLOCKED: Do not use lib/billing/stripe.ts. Use app/api/billing/* + lib/stripe/client.ts.');
}

// Legacy exports (kept to avoid breaking accidental imports).
export function getStripeClient(): any {
	blocked();
}

export function requireStripeWebhookSecret(): any {
	blocked();
}

export function getCheckoutLineItemsForPlan(_plan: import('@/lib/billing/plans').CheckoutPlan): any {
	blocked();
}
