import 'server-only';

import { headers } from 'next/headers';

import type Stripe from 'stripe';

import { badRequest, okJson } from '@/lib/api/json';
import { dbQuery } from '@/lib/db';
import { getStripe, getStripeWebhookSecret, isBillingUnavailableError } from '@/lib/stripe/client';

export const runtime = 'nodejs';

async function logWebhookEvent(event: Stripe.Event): Promise<void> {
  const action = `billing.webhook.${event.type}`;
  const targetType = event.data?.object?.object ?? null;
  const targetId = (event.data?.object as { id?: string } | undefined)?.id ?? null;

  await dbQuery(
    `INSERT INTO audit_events (actor_admin_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      'system',
      action,
      targetType,
      targetId,
      JSON.stringify({
        eventId: event.id,
        created: event.created,
        livemode: event.livemode,
      }),
    ],
  );
}

async function upsertSubscriptionFromStripe(
  userId: string,
  role: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
  status: string,
  lastPaymentStatus: string | null,
  currentPeriodEnd: number | null,
): Promise<void> {
  await dbQuery(
    `INSERT INTO billing_subscriptions (user_id, role, stripe_customer_id, stripe_subscription_id, status, last_payment_status, current_period_end)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7 IS NULL THEN NULL ELSE to_timestamp($7) END)
     ON CONFLICT (user_id) DO UPDATE SET
       role = EXCLUDED.role,
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       status = EXCLUDED.status,
       last_payment_status = EXCLUDED.last_payment_status,
       current_period_end = EXCLUDED.current_period_end,
       updated_at = now()`,
    [userId, role, stripeCustomerId, stripeSubscriptionId, status, lastPaymentStatus, currentPeriodEnd],
  );
}

async function markJobFeePaid(paymentIntentId: string): Promise<void> {
  await dbQuery(
    `UPDATE billing_job_fees
     SET paid = true, status = 'succeeded', updated_at = now()
     WHERE payment_intent_id = $1`,
    [paymentIntentId],
  );
}

function subscriptionPeriodEndFromItems(sub: Stripe.Subscription): number | null {
  try {
    const items = sub.items?.data ?? [];
    let max: number | null = null;
    for (const item of items) {
      const end = (item as { current_period_end?: number | null }).current_period_end;
      if (typeof end === 'number' && Number.isFinite(end)) {
        max = max === null ? end : Math.max(max, end);
      }
    }
    return max;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const headerList = await headers();
  const signature = headerList.get('stripe-signature');
  if (!signature) return badRequest('Missing Stripe signature.');

  let payload: string;
  try {
    payload = await req.text();
  } catch {
    return badRequest('Unable to read webhook payload.');
  }

  let event: Stripe.Event;
  let stripe: Stripe;
  try {
    stripe = getStripe();
    const secret = getStripeWebhookSecret();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    if (isBillingUnavailableError(err)) {
      // Fail-safe: acknowledge to avoid breaking user flows in environments without billing.
      return okJson({ error: 'billing_unavailable' }, 200);
    }
    return okJson({ received: true }, 200);
  }

  try {
    await logWebhookEvent(event);
  } catch {
    // ignore
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const role = session.metadata?.role;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
      const customerId = typeof session.customer === 'string' ? session.customer : null;
      if (userId && role && subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertSubscriptionFromStripe(
            userId,
            role,
            customerId,
            subscriptionId,
            sub.status,
            session.payment_status ?? null,
				subscriptionPeriodEndFromItems(sub),
          );
        } catch {
          // ignore
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const rawSubscription =
        (invoice as unknown as { subscription?: unknown }).subscription ??
        invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof rawSubscription === 'string' ? rawSubscription : null;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      const paymentStatus = event.type === 'invoice.payment_succeeded' ? 'succeeded' : 'failed';

      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          // We don't always have userId in invoice metadata; attempt to fetch from existing row.
          const existing = await dbQuery<{ user_id: string; role: string }>(
            `SELECT user_id, role FROM billing_subscriptions WHERE stripe_subscription_id = $1 LIMIT 1`,
            [subscriptionId],
          );
          const row = existing.rows[0];
          if (row) {
            await upsertSubscriptionFromStripe(
              row.user_id,
              row.role,
              customerId,
              subscriptionId,
              sub.status,
              paymentStatus,
				subscriptionPeriodEndFromItems(sub),
            );
          }
        } catch {
          // ignore
        }
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const companyId = pi.metadata?.companyId;
      const jobId = pi.metadata?.jobId;
      if (companyId && jobId) {
        try {
          await markJobFeePaid(pi.id);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // Fail-safe: never throw from webhook.
  }

  return okJson({ received: true }, 200);
}
