import 'server-only';

import { NextResponse } from 'next/server';

import { getServerAuthContext } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { getStripe, isBillingUnavailableError } from '@/lib/stripe/client';

export const runtime = 'nodejs';

type PortalRequest = {
	returnUrl?: string;
};

function json(status: number, body: unknown) {
	return NextResponse.json(body, { status });
}

function billingUnavailable() {
	return json(503, { error: 'billing_unavailable' });
}

function parseAbsoluteHttpUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	try {
		const url = new URL(value);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url.toString();
	} catch {
		return null;
	}
}

export async function POST(req: Request) {
	let auth;
	try {
		auth = await getServerAuthContext();
	} catch {
		return json(401, { error: 'unauthorized' });
	}

	if (auth.disabled) {
		return json(403, { error: 'forbidden' });
	}

	let body: PortalRequest;
	try {
		body = (await req.json()) as PortalRequest;
	} catch {
		return json(400, { error: 'invalid_request' });
	}

	const returnUrl = parseAbsoluteHttpUrl(body.returnUrl);
	if (!returnUrl) return json(400, { error: 'invalid_request' });

	try {
		const res = await dbQuery<{ stripe_customer_id: string | null }>(
			`SELECT stripe_customer_id FROM billing_subscriptions WHERE user_id = $1 LIMIT 1`,
			[auth.userId],
		);
		const customerId = res.rows[0]?.stripe_customer_id ?? null;
		if (!customerId) return billingUnavailable();

		const stripe = getStripe();
		const session = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: returnUrl,
		});

		return json(200, { url: session.url });
	} catch (err) {
		if (isBillingUnavailableError(err)) return billingUnavailable();
		return billingUnavailable();
	}
}
