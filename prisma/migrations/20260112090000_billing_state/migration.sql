-- Billing state tables for Stripe (subscriptions + job coordination fees)

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  user_id text PRIMARY KEY,
  role text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'inactive',
  last_payment_status text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_subscriptions_status_idx ON billing_subscriptions(status);
CREATE INDEX IF NOT EXISTS billing_subscriptions_role_idx ON billing_subscriptions(role);

CREATE TABLE IF NOT EXISTS billing_job_fees (
  job_id text PRIMARY KEY,
  company_id text NOT NULL,
  payment_intent_id text UNIQUE,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'created',
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_job_fees_company_idx ON billing_job_fees(company_id);
CREATE INDEX IF NOT EXISTS billing_job_fees_paid_idx ON billing_job_fees(paid);
