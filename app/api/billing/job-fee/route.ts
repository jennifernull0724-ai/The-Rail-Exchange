import 'server-only';

import { getServerAuthContext } from '@/lib/auth';
import { badRequest, forbidden, okJson, unauthorized } from '@/lib/api/json';
import { dbQuery } from '@/lib/db';
import { getStripe, isBillingUnavailableError } from '@/lib/stripe/client';

export const runtime = 'nodejs';

type JobFeeRequest = {
  jobId?: string;
  jobValue?: number; // USD
};

export async function POST(req: Request) {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  if (auth.disabled) {
    return forbidden('User disabled.');
  }

  if (auth.role !== 'logistics') {
    return forbidden('Access denied: logistics role required.');
  }

  let body: JobFeeRequest;
  try {
    body = (await req.json()) as JobFeeRequest;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : '';
  if (!jobId) return badRequest('jobId is required.');

  const jobValue = body.jobValue;
  if (typeof jobValue !== 'number' || !Number.isFinite(jobValue) || jobValue <= 0) {
    return badRequest('jobValue must be a positive number (USD).');
  }

  const feeUsd = Math.min(jobValue * 0.02, 10_000);
  const amountCents = Math.round(feeUsd * 100);
  if (amountCents <= 0) return badRequest('Calculated fee is invalid.');

  try {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      description: `Platform coordination fee — Job #${jobId}`,
      metadata: {
        jobId,
        companyId: auth.userId,
      },
    });

    try {
      await dbQuery(
        `INSERT INTO billing_job_fees (job_id, company_id, payment_intent_id, amount_cents, currency, status, paid)
         VALUES ($1, $2, $3, $4, 'usd', 'created', false)
         ON CONFLICT (job_id) DO UPDATE SET
           company_id = EXCLUDED.company_id,
           payment_intent_id = EXCLUDED.payment_intent_id,
           amount_cents = EXCLUDED.amount_cents,
           currency = EXCLUDED.currency,
           status = EXCLUDED.status,
           paid = EXCLUDED.paid,
           updated_at = now()`,
        [jobId, auth.userId, pi.id, amountCents],
      );
    } catch {
      // Fail-safe: do not block the payment intent creation if storage is unavailable.
    }

    return okJson(
      {
        paymentIntentId: pi.id,
        amount: feeUsd,
      },
      200,
    );
  } catch (err) {
    if (isBillingUnavailableError(err)) {
      return okJson({ error: 'billing_unavailable' }, 503);
    }
    return okJson({ error: err instanceof Error ? err.message : 'billing_unavailable' }, 500);
  }
}
