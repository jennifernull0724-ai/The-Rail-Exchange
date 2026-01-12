import 'server-only';

import Stripe from 'stripe';

export class BillingUnavailableError extends Error {
	override name = 'BillingUnavailableError';
}

let stripeInstance: Stripe | null = null;

function readTrimmedEnv(key: string): string | null {
	const value = process.env[key];
	if (value === undefined) return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function getStripe(): Stripe {
	if (stripeInstance) return stripeInstance;

	const secretKey = readTrimmedEnv('STRIPE_SECRET_KEY');
	if (!secretKey) {
		throw new BillingUnavailableError('billing_unavailable');
	}

	stripeInstance = new Stripe(secretKey, {
		// Use the Stripe SDK's bundled, type-safe API version.
		typescript: true,
	});

	return stripeInstance;
}

export function getStripeWebhookSecret(): string {
	const secret = readTrimmedEnv('STRIPE_WEBHOOK_SECRET');
	if (!secret) {
		throw new BillingUnavailableError('billing_unavailable');
	}
	return secret;
}

export function isBillingUnavailableError(err: unknown): err is BillingUnavailableError {
	return err instanceof BillingUnavailableError || (err instanceof Error && err.message === 'billing_unavailable');
}
