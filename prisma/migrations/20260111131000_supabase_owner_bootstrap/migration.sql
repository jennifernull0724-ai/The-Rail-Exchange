-- Supabase auth bootstrap + owner-admin authoritative tables

-- 1) Authoritative system_state
CREATE TABLE IF NOT EXISTS system_state (
  key text PRIMARY KEY,
  value boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO system_state (key, value)
VALUES ('admin_created', false)
ON CONFLICT (key) DO NOTHING;

-- 2) Authoritative users table (matches Supabase auth.users.id)
-- Ensure the required columns exist without dropping any existing analytics tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    CREATE TABLE users (
      id uuid PRIMARY KEY,
      email text UNIQUE NOT NULL,
      role text NOT NULL,
      is_owner boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      disabled boolean NOT NULL DEFAULT false
    );
  ELSE
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role text;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
    ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Enforce valid roles (constraint may already exist; keep idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN ('admin','contractor','logistics'));
  END IF;
END $$;

-- Enforce: at most one owner admin forever.
CREATE UNIQUE INDEX users_one_owner ON users ((1)) WHERE is_owner;

-- Ensure owner is always an admin (DB-level guardrail).
CREATE OR REPLACE FUNCTION enforce_owner_is_admin() RETURNS trigger AS $$
BEGIN
  IF NEW.is_owner = true AND NEW.role <> 'admin' THEN
    RAISE EXCEPTION 'Owner must have admin role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_enforce_owner_is_admin ON users;
CREATE TRIGGER users_enforce_owner_is_admin
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION enforce_owner_is_admin();

-- Audit log (append-only). If it already exists, keep the existing schema.
CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  actor_admin_id text,
  action text NOT NULL,
  target_type text,
  target_id text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
