import 'server-only';

import { NextResponse } from 'next/server';

import { getServerAuthContext } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getStripe, isBillingUnavailableError } from '@/lib/stripe/client';
import {
  CONTRACTOR_ANNUAL_PRICE_ID,
  LOGISTICS_ANNUAL_PRICE_ID,
  LOGISTICS_MONTHLY_PRICE_ID,
} from '@/lib/stripe/prices';

export const runtime = 'nodejs';

type CheckoutRequest = {
  role?: 'contractor' | 'logistics';
  plan?: 'monthly' | 'annual'; // logistics only
  successUrl?: string;
  cancelUrl?: string;
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

function priceIdFor(role: 'contractor' | 'logistics', plan: 'monthly' | 'annual' | null): string | null {
  if (role === 'contractor') return CONTRACTOR_ANNUAL_PRICE_ID || null;
  if (plan === 'monthly') return LOGISTICS_MONTHLY_PRICE_ID || null;
  if (plan === 'annual') return LOGISTICS_ANNUAL_PRICE_ID || null;
  return null;
}

async function getCustomerEmail(userId: string): Promise<string | undefined> {
  try {
    const supabase = getSupabaseServerClient();
    const userRes = await supabase.auth.getUser();
    const email = userRes.data.user?.email;
    if (email && email.trim()) return email.trim();
  } catch {
    // ignore
  }

  try {
    const res = await dbQuery<{ email: string }>(`SELECT email FROM users WHERE id::text = $1 LIMIT 1`, [userId]);
    const email = res.rows[0]?.email;
    if (email && email.trim()) return email.trim();
  } catch {
    // ignore
  }

  return undefined;
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

  let body: CheckoutRequest;
  try {
    body = (await req.json()) as CheckoutRequest;
  } catch {
    return json(400, { error: 'invalid_request' });
  }

  const role = body.role;
  if (role !== 'contractor' && role !== 'logistics') return json(400, { error: 'invalid_request' });
  if (auth.role !== role) return json(403, { error: 'forbidden' });

  const plan = body.plan;
  if (role === 'logistics') {
    if (plan !== 'monthly' && plan !== 'annual') return json(400, { error: 'invalid_request' });
  } else {
    if (plan !== undefined) return json(400, { error: 'invalid_request' });
  }

  const successUrl = parseAbsoluteHttpUrl(body.successUrl);
  const cancelUrl = parseAbsoluteHttpUrl(body.cancelUrl);
  if (!successUrl || !cancelUrl) return json(400, { error: 'invalid_request' });

  let checkoutPlan: 'monthly' | 'annual';
  let priceId: string | null;

  if (role === 'logistics') {
    checkoutPlan = plan as 'monthly' | 'annual';
    priceId = priceIdFor('logistics', checkoutPlan);
  } else {
    checkoutPlan = 'annual';
    priceId = priceIdFor('contractor', null);
  }

  if (!priceId) return billingUnavailable();

  try {
    const stripe = getStripe();
    const customerEmail = await getCustomerEmail(auth.userId);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        userId: auth.userId,
        role,
        plan: checkoutPlan,
      },
    });

    if (!session.url) return billingUnavailable();
    return json(200, { url: session.url });
  } catch (err) {
    if (isBillingUnavailableError(err)) return billingUnavailable();
    return json(500, { error: 'billing_unavailable' });
  }

  return billingUnavailable();
}
