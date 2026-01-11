-- Admin system sources required for analytics + audit

-- Core entities (analytics-only; do not use for business editing from admin UI)
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "last_login_at" TIMESTAMPTZ,
    "disabled_at" TIMESTAMPTZ
);

CREATE TABLE "companies" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "disabled_at" TIMESTAMPTZ
);

CREATE TABLE "jobs" (
    "id" TEXT PRIMARY KEY,
    "company_id" TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
    "title" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "jobs_status_idx" ON "jobs"("status");
CREATE INDEX "jobs_created_at_idx" ON "jobs"("created_at");

CREATE TABLE "messages" (
    "id" TEXT PRIMARY KEY,
    "from_user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "to_user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "thread_id" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "delivered_at" TIMESTAMPTZ,
    "read_at" TIMESTAMPTZ
);

CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");
CREATE INDEX "messages_status_idx" ON "messages"("status");

CREATE TABLE "documents" (
    "id" TEXT PRIMARY KEY,
    "owner_user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "owner_company_id" TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "expires_at" TIMESTAMPTZ
);

CREATE INDEX "documents_created_at_idx" ON "documents"("created_at");
CREATE INDEX "documents_kind_idx" ON "documents"("kind");

CREATE TABLE "certifications" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'valid',
    "issued_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "certifications_user_id_idx" ON "certifications"("user_id");
CREATE INDEX "certifications_expires_at_idx" ON "certifications"("expires_at");

-- System sources
CREATE TABLE "audit_events" (
    "id" BIGSERIAL PRIMARY KEY,
    "actor_admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");

CREATE TABLE "api_metrics" (
    "id" BIGSERIAL PRIMARY KEY,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "api_metrics_created_at_idx" ON "api_metrics"("created_at");
CREATE INDEX "api_metrics_route_idx" ON "api_metrics"("route");

CREATE TABLE "email_events" (
    "id" BIGSERIAL PRIMARY KEY,
    "provider" TEXT,
    "message_id" TEXT,
    "recipient" TEXT,
    "event_type" TEXT NOT NULL,
    "status" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "email_events_created_at_idx" ON "email_events"("created_at");
CREATE INDEX "email_events_event_type_idx" ON "email_events"("event_type");

-- Action backplanes (used by admin actions; processed by external workers/auth gateway)
CREATE TABLE "email_outbox" (
    "id" BIGSERIAL PRIMARY KEY,
    "recipient" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "sent_at" TIMESTAMPTZ
);

CREATE INDEX "email_outbox_created_at_idx" ON "email_outbox"("created_at");
CREATE INDEX "email_outbox_status_idx" ON "email_outbox"("status");

CREATE TABLE "force_logout_requests" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "processed_at" TIMESTAMPTZ
);

CREATE INDEX "force_logout_requests_created_at_idx" ON "force_logout_requests"("created_at");
CREATE INDEX "force_logout_requests_user_id_idx" ON "force_logout_requests"("user_id");
